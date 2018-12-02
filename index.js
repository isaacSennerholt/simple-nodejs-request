const URL = require("url");

module.exports = (url, { method, headers, body }) => {
  return new Promise((resolve, reject) => {
    const jsonBody = JSON.stringify(body) || null;
    const { protocol, hostname, port, path } = URL.parse(url);
    const protocolModule = require(`${
      protocol ? protocol.replace(":", "") : "http"
    }`);
    const httpOptions = {
      hostname,
      port,
      path,
      method: method ? method.toUpperCase() : "GET",
      headers: {
        ...headers,
        ...(jsonBody && { "content-length": Buffer.byteLength(jsonBody) }),
        "content-type": "application/json",
        accept: "application/json"
      }
    };

    let responseBody = "";
    const request = protocolModule.request(httpOptions, response => {
      const { statusCode } = response;
      response.setEncoding("utf8");
      response.on("data", chunk => (responseBody += chunk));
      response.on("end", () => {
        let parsedResponseBody;
        try {
          parsedResponseBody = JSON.parse(responseBody);
        } catch (error) {
          parsedResponseBody = {};
        }
        resolve({ status: statusCode, body: parsedResponseBody });
      });
    });

    request.on("error", error => reject(error));

    if (
      method === "POST" ||
      method === "PUT" ||
      method === "DELETE" ||
      method === "PATCH"
    ) {
      request.write(jsonBody);
    }

    request.end();
  });
};
