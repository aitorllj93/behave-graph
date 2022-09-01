/* eslint-disable space-in-parens */
import Debug from '../../Debug';
import Node from '../../Nodes/Node';
import NodeSocketRef from '../../Nodes/NodeSocketRef';
import Graph from '../Graph';

// eslint-disable-next-line no-promise-executor-return
const sleep = (duration:number) => new Promise((resolve) => setTimeout(resolve, Math.round(duration * 1000)));
/*
class SyncWorkStack {
  public stack = NodeSocketRef;
}
class AsyncWorkQueue {
  public queue: SyncWorkStack[] = [];
} */

export default class GraphEvaluator {
  // tracking the next node+input socket to execute.
  public flowWorkQueue: NodeSocketRef[] = [];
  public asyncNodes: Node[] = [];

  constructor(public graph: Graph, public verbose = false) {
  }

  // maybe this should have an id?
  // IMPORTANT: should events somehow register themselves at graph initialization?  There is a missing step here.
  // This simplistic approach is okay if events do no have filters themselves.
  triggerEvents(nodeName: string, outputValues: Map<string, any> = new Map<string, any>()): number {
    // look up any nodes with this trigger name and add them to the executionQueue
    const nodes = Object.values(this.graph.nodes).filter((node) => (node.typeName === nodeName));

    nodes.forEach((node) => {
      // apply output values
      outputValues.forEach((value, name) => {
        // eslint-disable-next-line no-param-reassign
        node.getOutputSocket(name).value = value;
      });

      let flowOutputCount = 0;
      node.outputSockets.forEach((outputSocket) => {
        // console.log(outputSocket);
        if (outputSocket.valueTypeName === 'flow') {
          if (outputSocket.links.length === 1) {
            this.flowWorkQueue.push(outputSocket.links[0]);
            flowOutputCount++;
          }
          if (outputSocket.links.length > 1) {
            throw new Error(`flow output ${node.typeName}.${outputSocket.name} has more than 1 downstream link, ${outputSocket.links.length}`);
          }
        }
      });
      if (flowOutputCount === 0) {
        throw new Error(`no flow outputs for trigger event ${nodeName}`);
      }
    });

    // inform how many trigger nodes were triggered
    return nodes.length;
  }

  // NOTE: This does not execute all if there are promises.
  executeAll(stepLimit: number = 100000000): number {
    let stepsExecuted = 0;
    while ((stepsExecuted < stepLimit) && this.executeStep()) {
      stepsExecuted++;
    }
    return stepsExecuted;
  }

  async executeAllAsync(timeLimit = 100, stepLimit: number = 100000000): Promise<number> {
    const startDateTime = Date.now();
    let stepsExecuted = 0;
    let elapsedTime = 0;
    let iterations = 0;
    do {
      if ( iterations > 0 ) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(0);
      }
      stepsExecuted += this.executeAll(stepLimit);
      Debug.logVerbose(`this.asyncNodes.length: ${this.asyncNodes.length}`);
      Debug.logVerbose(`this.flowWorkQueue.length: ${this.flowWorkQueue.length}`);
      elapsedTime = ( Date.now() - startDateTime ) * 0.001;
      iterations += 1;
    } while ((this.asyncNodes.length > 0 || this.flowWorkQueue.length > 0) && ( elapsedTime < timeLimit ) && stepsExecuted < stepLimit);

    return stepsExecuted;
  }
}
