async function loadEditor() {
  const res = await fetch("/content/site.json");
  const json = await res.text();
  document.getElementById("json-editor").value = json;
}

document.getElementById("save-json").addEventListener("click", () => {
  const content = document.getElementById("json-editor").value;

  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "site.json";
  a.click();

  URL.revokeObjectURL(url);
});

document.addEventListener("DOMContentLoaded", loadEditor);
