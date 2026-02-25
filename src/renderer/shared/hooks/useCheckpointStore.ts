import { useEffect, useState } from "react";
import {
  getCheckpointStoreState,
  subscribeCheckpointStore,
} from "@/stores/checkpoint-store";

/**
 * Subscribe to checkpoint store state (e.g. isRestoring).
 */
export function useCheckpointStore() {
  const [state, setState] = useState(getCheckpointStoreState);

  useEffect(() => {
    const unsubscribe = subscribeCheckpointStore(() => {
      setState(getCheckpointStoreState());
    });
    return unsubscribe;
  }, []);

  return state;
}
