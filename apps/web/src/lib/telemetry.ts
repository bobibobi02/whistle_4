import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'whistle-service',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
});

sdk.start()
  .then(() => console.log(' OpenTelemetry initialized'))
  .catch(console.error);

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch(console.error)
    .finally(() => process.exit(0));
});

