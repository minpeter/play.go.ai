import axios from "axios";

export interface runnerResponse {
  code: string;
  error: string;
  result: string;
}

interface GoCodeRunnerResponse {
  Body: string;
  Errors: string;
  Events: {
    Kind: string;
    Message: string;
  };
}

export async function POST(req: Request) {
  const { code } = await req.json();
  const result: runnerResponse = { code: "", error: "", result: "" };

  const fmtResponse = await sendRequest("/fmt", {
    body: code,
    imports: true,
  });
  if (fmtResponse.Error) {
    result.error = fmtResponse.Error;
    return sendResponse(result);
  }

  result.code = fmtResponse.Body;

  const runResponse = await sendRequest("/compile", {
    body: result.code,
    withVet: "true",
    version: "2",
  });
  if (runResponse.Errors) {
    result.error = runResponse.Errors;
    return sendResponse(result);
  }

  runResponse.Events?.forEach((event: GoCodeRunnerResponse["Events"]) => {
    if (event.Kind === "stdout") {
      result.result += event.Message;
    } else if (event.Kind === "stderr") {
      result.result += event.Message;
    } else {
      result.result += `${event.Kind}: ${event.Message}`;
    }
  });

  return sendResponse(result);
}

async function sendRequest(url: string, data: any) {
  const instance = axios.create({
    baseURL: "https://go.dev/_",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const response = await instance.post(url, data);

  return response.data;
}

async function sendResponse(response: any) {
  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
