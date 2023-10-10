import bunyan from "bunyan";
import bunyanFormat from "bunyan-format";

const formatOut = bunyanFormat({ outputMode: "short" });
const logger = bunyan.createLogger({
  name: "hostforge",
  streams: [{ stream: formatOut }],
});

export default logger;
