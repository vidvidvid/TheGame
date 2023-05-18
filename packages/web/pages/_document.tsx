import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import React from 'react';

export enum TrackEvent {
  Signup = 'Signup',
  Error = '404',
  ChainCreated = 'Chain created',
}

type PlausibleArgs = [TrackEvent, () => void] | [TrackEvent];

declare global {
  const plausible: {
    (...args: PlausibleArgs): void;
    q?: PlausibleArgs[];
  };

  interface Window {
    plausible?: typeof plausible;
  }
}

class MetaDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    return Document.getInitialProps(ctx);
  }

  // eslint-disable-next-line class-methods-use-this
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;700&amp;family=Press+Start+2P&amp;family=Exo+2:ital,wght@0,100;0,200;0,400;0,500;0,600;0,700;1,400&amp;family=Courier+Prime:wght@400;700&amp;display=swap"
            rel="stylesheet"
          />
          <link rel="shortcut icon" href="/favicon.png" />
          <script
            dangerouslySetInnerHTML={{
              __html:
                'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }',
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MetaDocument;
