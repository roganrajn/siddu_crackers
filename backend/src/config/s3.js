import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const bucket = () => process.env.AWS_S3_BUCKET;
const region = () => process.env.AWS_REGION || 'us-east-1';
const rootFolder = () => (process.env.AWS_S3_FOLDER || 'siddu_crackers').replace(/^\/+|\/+$/g, '');

const s3Client = new S3Client({
  region: region(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export function getS3PublicUrl(key) {
  const b = bucket();
  const r = region();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  if (r === 'us-east-1') {
    return `https://${b}.s3.amazonaws.com/${encodedKey}`;
  }
  return `https://${b}.s3.${r}.amazonaws.com/${encodedKey}`;
}

export function buildS3Key(subfolder, filename) {
  const folder = subfolder.replace(/^\/+|\/+$/g, '');
  const safeName = filename.replace(/\s+/g, '-');
  return `${rootFolder()}/${folder}/${Date.now()}-${safeName}`;
}

export function parseS3KeyFromUrl(url) {
  if (!url || !bucket()) return null;
  const b = bucket();
  const patterns = [
    new RegExp(`https://${b}\\.s3\\.amazonaws\\.com/(.+)`),
    new RegExp(`https://${b}\\.s3\\.[^/]+\\.amazonaws\\.com/(.+)`),
    new RegExp(`https://s3\\.[^/]+\\.amazonaws\\.com/${b}/(.+)`),
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export const uploadToS3 = async (file, folder = 'uploads') => {
  const key = buildS3Key(folder, file.originalname);
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);
  return getS3PublicUrl(key);
};

export const deleteFromS3 = async (url) => {
  const key = parseS3KeyFromUrl(url);
  if (!key) return;
  await deleteS3ObjectByKey(key);
};

export function isKeyInRootFolder(key) {
  const root = `${rootFolder()}/`;
  const normalized = key.replace(/^\/+/, '');
  return normalized === rootFolder() || normalized.startsWith(root);
}

export const deleteS3ObjectByKey = async (key) => {
  if (!key || !isKeyInRootFolder(key)) {
    const err = new Error('Invalid S3 key — can only delete files under your app folder');
    err.status = 400;
    throw err;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket(),
    Key: key.replace(/^\/+/, ''),
  });
  await s3Client.send(command);
  return { key, deleted: true };
};

export const listS3Objects = async ({ subfolder = '', maxKeys = 500 } = {}) => {
  const prefix = subfolder
    ? `${rootFolder()}/${subfolder.replace(/^\/+|\/+$/g, '')}/`
    : `${rootFolder()}/`;

  const items = [];
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: prefix,
      MaxKeys: Math.min(maxKeys - items.length, 1000),
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    for (const obj of response.Contents || []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue;

      const relativeKey = obj.Key.replace(`${rootFolder()}/`, '');
      const folder = relativeKey.includes('/')
        ? relativeKey.split('/')[0]
        : 'root';

      items.push({
        key: obj.Key,
        url: getS3PublicUrl(obj.Key),
        folder,
        filename: path.basename(obj.Key),
        size: obj.Size,
        lastModified: obj.LastModified,
      });

      if (items.length >= maxKeys) break;
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken && items.length < maxKeys);

  return {
    bucket: bucket(),
    rootFolder: rootFolder(),
    prefix,
    count: items.length,
    items,
  };
};

export const isS3Configured = () =>
  !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

export default s3Client;
