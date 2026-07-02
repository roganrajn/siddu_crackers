/** Business timezone — order dates are filtered/displayed in IST */
export const APP_TIMEZONE = 'Asia/Kolkata';

export const LOCAL_ORDER_DATE = `(created_at AT TIME ZONE '${APP_TIMEZONE}')::date`;

/**
 * Build SQL date-range conditions against orders.created_at in local (IST) calendar days.
 */
export function buildOrderDateFilter(date_from, date_to, startIndex = 1) {
  const parts = [];
  const params = [];
  let i = startIndex;

  if (date_from) {
    parts.push(`${LOCAL_ORDER_DATE} >= $${i++}::date`);
    params.push(date_from);
  }
  if (date_to) {
    parts.push(`${LOCAL_ORDER_DATE} <= $${i++}::date`);
    params.push(date_to);
  }

  const sql = parts.join(' AND ');

  return {
    sql,
    where: sql ? `WHERE ${sql}` : '',
    and: sql ? `AND ${sql}` : '',
    params,
    nextIndex: i,
  };
}

export function localOrderDateSql(alias = 'created_at') {
  return `(${alias} AT TIME ZONE '${APP_TIMEZONE}')::date`;
}
