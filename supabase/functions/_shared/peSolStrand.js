// Backward-compatible exports for code that previously imported the PE-only
// classifier. Exact Virginia PE and Health banks now live together.
export {
  classifiedPeStandards,
  classifiedVirginiaStandards,
  VA_SOL_BANKS,
} from './vaSolStandards.js';
