import { Configuration, OpenAIApi } from 'openai';

export async function getGPTOutputsAsyncOneByOne(
  table,
  promptField,
  promptPrefix,
  promptSuffix,
  outputField,
  records,
  apiKey
) {
  // this function calls the OpenAI API and returns the outputs
  const config = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(config);

  for (const record of records) {
    const prompt =
      promptPrefix + record.getCellValueAsString(promptField) + promptSuffix;

    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const output = completion.data.choices[0].message.content.trim();

      return table.updateRecordAsync(record.id, {
        [outputField.id]: output,
      });
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }
}

export async function getGPTOutputsAsync(
  table,
  promptField,
  promptPrefix,
  promptSuffix,
  outputField,
  records,
  apiKey,
  maxRetries = 5
) {
  // this function calls the OpenAI API and returns the outputs
  const config = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(config);

  const promises = records.map(async (record) => {
    const prompt =
      promptPrefix + record.getCellValueAsString(promptField) + promptSuffix;

    let numRetries = 0;
    while (numRetries <= maxRetries) {
      try {
        const completion = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });

        const output = completion.data.choices[0].message.content.trim();

        return table.updateRecordAsync(record.id, {
          [outputField.id]: output,
        });
      } catch (error) {
        if (error.response) {
          console.log(error.response.status);
          console.log(error.response.data);
        } else {
          console.log(error.message);
        }

        const delayTime = Math.pow(2, numRetries) * 1000;
        await delay(delayTime);

        numRetries++;
      }
    }

    console.error(`Max retries exceeded for record ${record.id}`);
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
