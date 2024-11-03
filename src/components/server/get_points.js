'use Server'
import OpenAI from "openai";
const OPENAI_API_KEY=process.env.NEXT_PUBLIC_OPENAI_API_KEY;
// console.log(OPENAI_API_KEY);
const thread_id= 'thread_pUh5jBdYrDsYKcmiOU06e2OO';
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY ,dangerouslyAllowBrowser: true 
});

export const chatgpt_api = async (input,messages,data) => {
    await openai.beta.threads.messages.create(
        thread_id,
        {
          role: "user",
          content: '--data--\n'+JSON.stringify(data, null, 2)+'\n--input--\n'+input,
        }
      );
    let response = await openai.beta.threads.runs.createAndPoll(
        thread_id,
        { 
          assistant_id: 'asst_BCDk9DA47rLGAhHXkXrpzPaX'
          // Include any other parameters needed
        }
      );

      if (response.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(
            response.thread_id
        );
        // console.log(messages)
        response = messages.data[0]
      } else {
        // console.log(run.status);
      }
  const contentString = response.content[0].text.value;
  const contentObject = JSON.parse(contentString);
  
  let code=contentObject.mermaid_code;
  
  let message=contentObject.message;
  // console.log()
  return {code,message};
  };