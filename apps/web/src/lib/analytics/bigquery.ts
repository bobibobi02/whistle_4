import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery();

export async function loadEventsFromFile(filePath: string, datasetId: string, tableId: string) {
  await bigquery
    .dataset(datasetId)
    .table(tableId)
    .load(filePath, {
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_APPEND'
    });
}
