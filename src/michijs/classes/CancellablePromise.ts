/**
 * A class that wraps a Promise and adds cancellation support.
 *
 * When cancelled, the promise resolves immediately, skipping the callback.
 */
export class CancellablePromise<T = any> {
  /** Indicates whether the promise has been cancelled */
  cancelled = false;

  /** A promise resolver used to prematurely resolve the race */
  private fakePromise = Promise.withResolvers<T>();

  /**
   * Creates a cancellable promise.
   *
   * @param promise The original promise to wrap.
   * @param callback A callback to handle the resolved value, unless cancelled.
   */
  constructor(promise: Promise<T>, callback: (result: T) => void) {
    Promise.race([promise, this.fakePromise.promise])
      .then((result) => {
        if (!this.cancelled) callback(result);
      })
      .catch((error) => {
        if (!this.cancelled) throw error; // Rethrow error if not cancelled
      });
  }

  /**
   * Cancels the promise, preventing the callback from being executed.
   */
  cancel() {
    this.cancelled = true;
    this.fakePromise.resolve();
  }
}
