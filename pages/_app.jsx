import "./../styles/style.scss";

import { Web3Provider } from "../components/Web3Provider";

function MyApp({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
    </Web3Provider>
  );
}

export default MyApp;