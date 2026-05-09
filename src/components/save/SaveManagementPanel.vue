<template>
  <section class="mb-4 rounded border border-line bg-ink p-3 text-sm">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold text-slate-200">本地存档</h3>
        <p class="text-xs text-slate-500">{{ snapshotText }}</p>
      </div>
      <span class="rounded border border-line px-2 py-1 text-xs text-slate-400">v{{ save.version }}</span>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button
        class="rounded border border-line bg-panel px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
        @click="saveLocal"
      >
        保存本地
      </button>
      <button
        class="rounded border border-line bg-panel px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
        @click="loadLocal"
      >
        读取本地
      </button>
      <button
        class="rounded border border-line bg-panel px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
        @click="exportSave"
      >
        导出存档
      </button>
      <button
        class="rounded border border-line bg-panel px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
        @click="openImport"
      >
        导入存档
      </button>
    </div>

    <input ref="fileInput" class="hidden" type="file" accept="application/json,.json" @change="readImportFile" />

    <p v-if="statusMessage" class="mt-3 rounded border px-2 py-2 text-xs" :class="statusClass">
      {{ statusMessage }}
    </p>

    <div
      v-if="showImportConfirm"
      class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="导入存档确认"
    >
      <section class="w-full max-w-lg rounded border border-amber-500/40 bg-panel p-5 shadow-2xl shadow-black/60">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase text-amber-300">导入确认</p>
            <h2 class="text-xl font-semibold text-slate-100">覆盖当前存档</h2>
            <p class="mt-1 text-sm text-slate-400">
              将导入 {{ pendingImportName }}，当前角色、背包、设置和关卡进度会被覆盖，自动挂机不会恢复。
            </p>
          </div>
          <button
            class="rounded border border-line px-3 py-1 text-sm text-slate-300 hover:border-slate-500"
            @click="cancelImport"
          >
            关闭
          </button>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            class="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            @click="cancelImport"
          >
            取消
          </button>
          <button
            class="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
            @click="confirmImport"
          >
            确认导入
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSaveStore } from '@/stores/save';

type StatusTone = 'idle' | 'success' | 'error';

const save = useSaveStore();
const fileInput = ref<HTMLInputElement | null>(null);
const statusMessage = ref('');
const statusTone = ref<StatusTone>('idle');
const pendingImportText = ref('');
const pendingImportName = ref('');
const showImportConfirm = ref(false);

const snapshotText = computed(() => {
  if (!save.lastSnapshotAt) return '尚未生成本地快照';
  return `最近快照 ${new Date(save.lastSnapshotAt).toLocaleString('zh-CN')}`;
});

const statusClass = computed(() => {
  if (statusTone.value === 'success') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (statusTone.value === 'error') return 'border-red-500/40 bg-red-500/10 text-red-200';
  return 'border-line text-slate-400';
});

async function saveLocal() {
  const result = await save.saveToLocal();
  setStatus(result.ok ? '本地存档已保存。' : (result.error ?? '保存失败。'), result.ok ? 'success' : 'error');
}

async function loadLocal() {
  const result = await save.loadFromLocal();
  if (result.ok && !result.data) {
    setStatus('没有找到本地快照。', 'error');
    return;
  }
  setStatus(result.ok ? '本地快照已读取。' : (result.error ?? '读取失败。'), result.ok ? 'success' : 'error');
}

function exportSave() {
  const result = save.exportSave();
  if (!result.ok || !result.data) {
    setStatus(result.error ?? '导出失败。', 'error');
    return;
  }

  const blob = new Blob([result.data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `cq-demo-save-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus('存档已导出。', 'success');
}

function openImport() {
  fileInput.value?.click();
}

function readImportFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      setStatus('读取导入文件失败。', 'error');
      return;
    }
    pendingImportText.value = reader.result;
    pendingImportName.value = file.name;
    showImportConfirm.value = true;
  };
  reader.onerror = () => setStatus('读取导入文件失败。', 'error');
  reader.readAsText(file);
}

async function confirmImport() {
  const result = save.importSave(pendingImportText.value);
  if (!result.ok) {
    setStatus(result.error ?? '导入失败。', 'error');
    cancelImport();
    return;
  }

  const saved = await save.saveToLocal();
  setStatus(
    saved.ok ? '存档已导入并写入本地快照。' : (saved.error ?? '导入成功，但写入本地快照失败。'),
    saved.ok ? 'success' : 'error',
  );
  cancelImport();
}

function cancelImport() {
  showImportConfirm.value = false;
  pendingImportText.value = '';
  pendingImportName.value = '';
}

function setStatus(message: string, tone: StatusTone) {
  statusMessage.value = message;
  statusTone.value = tone;
}
</script>
