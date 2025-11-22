'use client';
import { useDialog } from '@/components/ui/DialogProvider';

export function useConfirm() {
  const { confirm } = useDialog();
  return confirm;
}

export function useNotify() {
  const { notify } = useDialog();
  return notify;
}
