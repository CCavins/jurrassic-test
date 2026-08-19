export function useCapture() {
  return {
    takePhoto: async () => (await import('../ar/xrFacade')).xrFacade.takePhoto(),
    startRecording: async () => (await import('../ar/xrFacade')).xrFacade.startRecording(),
    stopRecording: async () => (await import('../ar/xrFacade')).xrFacade.stopRecording(),
  }
}
