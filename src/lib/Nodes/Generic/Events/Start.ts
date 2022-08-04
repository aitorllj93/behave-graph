import FlowSocket from '../../../Sockets/Typed/FlowSocket';
import Node from '../../Node';
import { NodeCategory } from '../../NodeCategory';

// TODO: Figure out how to force the evaluation of these from the outside.
// TODO: Figure out how to set values for the outputs in a consistent way.  Add to context?  Have a set of output values pre-specified when you trigger it?
// QQ: Should one just trigger its outputs directly rather than even evaluating it?

export default class Start extends Node {
  constructor() {
    super(
      NodeCategory.Event,
      'event/start',
      [],
      [new FlowSocket()],
      () => {},
    );
  }
}
