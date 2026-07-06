import { create } from "zustand";

interface CriticalErrorState {
  isOpen: boolean,
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  showCriticalConfirm: (payload: {
    title: string,
    message: string,
    confirmLabel?: string,
    onConfirm?: () => void,
  }) => void
  dismiss: () => void
}

export const useCriticalErrorStore = create<CriticalErrorState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: '',
  onConfirm: () => { },
  showCriticalConfirm: ({ title, message, confirmLabel = "Đồng ý", onConfirm = () => { } }) => {
    set({ isOpen: true, title, message, confirmLabel, onConfirm })
  },
  dismiss: () => { set({ isOpen: false, title: '', message: '', confirmLabel: 'Đồng ý', onConfirm: () => { } }) }
}))

export const showCriticalError = (payload: Parameters<CriticalErrorState['showCriticalConfirm']>[0]) => {
  useCriticalErrorStore.getState().showCriticalConfirm(payload)
}