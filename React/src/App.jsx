import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {

  const [result, setResult] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const API =
    import.meta.env.VITE_Backend_URL;

  async function processUrls(urls) {

    const batchSize = 50;

    let finalResults = [];

    for (
      let i = 0;
      i < urls.length;
      i += batchSize
    ) {

      const batch =
        urls.slice(
          i,
          i + batchSize
        );

      const res =
        await axios.post(
          `${API}/status`,
          {
            urls: batch
          }
        );

      finalResults = [
        ...finalResults,
        ...res.data
      ];

      console.log(
        `Completed ${
          i + batch.length
        }`
      );
    }

    return finalResults;
  }

  async function sendURLs() {

    const urls = input
      .split("\n")
      .map(url => url.trim())
      .filter(url => url !== "");

    if (urls.length === 0) {
      alert("Enter URLs");
      return;
    }

    try {

      setLoading(true);

      const res =
        await processUrls(urls);

      setResult(res);

    } catch (err) {

      console.log(err);

      alert("Error processing URLs");

    } finally {

      setLoading(false);
    }
  }

  function downloadCSV(results) {

    if (!results.length) return;

    const headers =
      ["URL", "STATUS"];

    const rows =
      results.map(r => [
        r.url,
        r.status
      ]);

    const csvContent =
      [headers, ...rows]
        .map(e => e.join(","))
        .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type: "text/csv"
        }
      );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "results.csv";

    a.click();

    window.URL.revokeObjectURL(url);
  }

  return (
    <>
      <div id="inputfield">

        <h1>
          Akash URL Hospital
        </h1>

        <textarea
          rows="10"
          cols="50"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="One URL per line"
        />

        <br />

        <button
          onClick={sendURLs}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Send Data"}
        </button>

        <button
          onClick={() =>
            downloadCSV(result)
          }
           disabled={!result.length}
        >
          Download CSV
        </button>

      </div>

      <div id="output">

        <table border={1}>

          <thead>
            <tr>
              <th>No.</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
             {result.length === 0 ? (
    <tr>
      <td colSpan="3">
        No Results
      </td>
    </tr>
  ) :
     result.map((res, index) => (

                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{res.url}</td>
                  <td>{res.status}</td>
                </tr>

              ))}

          </tbody>

        </table>

      </div>
    </>
  );
}

export default App;