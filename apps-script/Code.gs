// Deploy as a Google Apps Script web app. Keep the deployment URL in the
// base-station's ignored secrets.h file; never commit the real URL.
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) throw new Error("Sheet1 not found");
    if (!e || !e.postData || !e.postData.contents) throw new Error("Missing POST body");
    const d = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(), d.source, d.destination, d.packetID, d.ttl,
      d.mq2, d.mq5, d.mq9, d.mq135, d.fire, d.distance,
      d.temperature, d.humidity, d.ax, d.ay, d.az, d.gx, d.gy, d.gz,
      d.rssi, d.snr
    ]);
    return json({ status: "success", message: "Data stored successfully" });
  } catch (err) {
    return json({ status: "error", message: err.toString() });
  }
}

function doGet() {
  return ContentService.createTextOutput("Rover Google Sheets API is running");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
