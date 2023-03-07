// Airtable SDK limit: we can only update 50 records at a time. For more details, see
// https://github.com/Airtable/blocks/blob/master/packages/sdk/docs/guide_writes.md#size-limits--rate-limits
const MAX_RECORDS_PER_UPDATE = 50;

export async function updateRecordsInBatchesAsync(table, recordUpdates) {
  // Fetches & saves the updates in batches of MAX_RECORDS_PER_UPDATE to stay under size limits.
  let i = 0;
  while (i < recordUpdates.length) {
    const updateBatch = recordUpdates.slice(i, i + MAX_RECORDS_PER_UPDATE);
    // await is used to wait for the update to finish saving to Airtable servers before
    // continuing. This means we'll stay under the rate limit for writes.
    await table.updateRecordsAsync(updateBatch);
    i += MAX_RECORDS_PER_UPDATE;
  }
}
