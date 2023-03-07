import {
  initializeBlock,
  useBase,
  useRecords,
  useGlobalConfig,
  TablePickerSynced,
  FieldPickerSynced,
  InputSynced,
  Loader,
  Button,
  Box,
} from '@airtable/blocks/ui';
import React, { Fragment, useState } from 'react';

import { getGPTOutputsAsync } from './fn-api.js';

// The code is largely based on the Airtable's Wikipedia Enrichment, licensed under MIT
// accessible at https://github.com/Airtable/apps-wikipedia-enrichment

function GPTmyAirtable() {
  const base = useBase();

  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get('apiKey');
  const tableId = globalConfig.get('selectedTableId');
  const promptFieldId = globalConfig.get('selectedPromptFieldId');
  const outputFieldId = globalConfig.get('selectedOutputFieldId');

  const table = base.getTableByIdIfExists(tableId);
  const promptField = table ? table.getFieldByIdIfExists(promptFieldId) : null;
  const outputField = table ? table.getFieldByIdIfExists(outputFieldId) : null;

  const promptPrefix = globalConfig.get('promptPrefix');
  const promptSuffix = globalConfig.get('promptSuffix');

  // load the records ready to be updated
  // we only need to load the word field - the others don't get read, only written to.
  const records = useRecords(table, { fields: [promptField] });

  // keep track of whether we have up update currently in progress - if there is, we want to hide
  // the update button so you can't have two updates running at once.
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  // check whether we have permission to update our records or not. Any time we do a permissions
  // check like this, we can pass in undefined for values we don't yet know. Here, as we want to
  // make sure we can update the summary and image fields, we make sure to include them even
  // though we don't know the values we want to use for them yet.
  //   const permissionCheck = table.checkPermissionsForUpdateRecord(undefined, {
  //     [outputField.name]: undefined,
  //   });

  async function onButtonClick() {
    setIsUpdateInProgress(true);
    try {
      await getGPTOutputsAsync(
        table,
        promptField,
        promptPrefix,
        promptSuffix,
        outputField,
        records,
        apiKey
      );
    } catch (error) {
      console.error(error);
    }
    setIsUpdateInProgress(false);
  }

  return (
    <Box padding={3}>
      <h1>GPTmyAirtable</h1>
      <p>OpenAI API key:</p>
      <InputSynced type="password" globalConfigKey="apiKey" />
      <p>Table:</p>
      <TablePickerSynced globalConfigKey="selectedTableId" />
      <p>Prompt field:</p>
      <FieldPickerSynced
        table={table}
        globalConfigKey="selectedPromptFieldId"
      />
      <p>Prompt prefix:</p>
      <InputSynced globalConfigKey="promptPrefix" />
      <p>Prompt suffix:</p>
      <InputSynced globalConfigKey="promptSuffix" />
      <p>Output field:</p>
      <FieldPickerSynced
        table={table}
        globalConfigKey="selectedOutputFieldId"
      />
      {/* TODO: Checkbox to overwrite output. If not, skip in prompt */}
      <Box
        padding={3}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {isUpdateInProgress ? (
          <Loader />
        ) : (
          <Fragment>
            <Button
              variant="primary"
              onClick={onButtonClick}
              //   disabled={!permissionCheck.hasPermission}
              marginBottom={3}
            >
              Perform GPTmyAirtable Magic 🪄
            </Button>
            {/* {!permissionCheck.hasPermission &&
              // when we don't have permission to perform the update, we want to tell the
              // user why. `reasonDisplayString` is a human-readable string that will
              // explain why the button is disabled.
              permissionCheck.reasonDisplayString} */}
          </Fragment>
        )}
      </Box>
      {/* TODO: number of records & time elapsed */}
    </Box>
  );
}

initializeBlock(() => <GPTmyAirtable />);
