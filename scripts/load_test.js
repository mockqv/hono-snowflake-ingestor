const TOTAL_REQUESTS = 100;
const API_URL = "http://host.docker.internal:3000/ingest";

console.log(`Starting load test with ${TOTAL_REQUESTS} requests...`);

const services = ["payment-api", "auth-service", "frontend-app", "billing-worker"];
const levels = ["INFO", "ERROR", "WARN", "DEBUG"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function sendRequest(id) {
  const payload = {
    service_name: getRandomElement(services),
    log_level: getRandomElement(levels),
    message: `Load test message #${id}`,
    environment: "stress-test",
    timestamp: new Date().toISOString()
  };

  try {
    const start = Date.now();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const duration = Date.now() - start;

    if (res.status === 202) {
      process.stdout.write(".");
      return { success: true, duration };
    } else {
      process.stdout.write("x");
      return { success: false, duration, status: res.status };
    }
  } catch (err) {
    process.stdout.write("!");
    return { success: false, duration: 0, error: err.message };
  }
}

(async () => {
  const startTime = Date.now();
  
  const promises = Array.from({ length: TOTAL_REQUESTS }, (_, i) => sendRequest(i));
  const results = await Promise.all(promises);

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  console.log("\n\n--- RESULTS ---");
  console.log(`Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`RPS: ${(TOTAL_REQUESTS / totalTime).toFixed(2)}`);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Success: ${successCount}/${TOTAL_REQUESTS}`);
  console.log(`Failures: ${TOTAL_REQUESTS - successCount}`);
})();