exports.handler = async (event) => {
  console.log("Test log!!!");
  const response = {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!!!'),
  };
  return response;
};