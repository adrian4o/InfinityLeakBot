import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("✅ InfinityLeakBot is alive and running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
