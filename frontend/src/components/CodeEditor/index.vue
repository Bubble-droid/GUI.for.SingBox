<script setup lang="ts">
import { autocompletion } from '@codemirror/autocomplete'
import { indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { yaml } from '@codemirror/lang-yaml'
import { linter } from '@codemirror/lint'
import { MergeView } from '@codemirror/merge'
import { Compartment } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap, placeholder as Placeholder } from '@codemirror/view'
import { EditorView, basicSetup } from 'codemirror'
import * as parserBabel from 'prettier/parser-babel'
import * as parserYaml from 'prettier/parser-yaml'
import estreePlugin from 'prettier/plugins/estree'
import * as prettier from 'prettier/standalone'
import { watch, onUnmounted, onMounted, useTemplateRef, inject } from 'vue'

import { Theme } from '@/enums/app'
import { useAppSettingsStore } from '@/stores/appSettings'
import { getCompletions } from '@/utils/completion'
import { message } from '@/utils/interaction'
import { debounce } from '@/utils/others'

import { IS_IN_MODAL } from '@/components/Modal/state'

interface Props {
  editable?: boolean
  lang?: 'json' | 'javascript' | 'yaml'
  mode?: 'editor' | 'diff'
  placeholder?: string
  plugin?: Record<string, any> | undefined
}

const model = defineModel<string>({ required: true })

const {
  editable,
  lang = 'json',
  mode = 'editor',
  placeholder = '',
  plugin = undefined,
} = defineProps<Props>()

const emit = defineEmits<{
  change: [content: string]
}>()

const { promise: editorReady, resolve: markEditorReady } = Promise.withResolvers()
let internalUpdate = true

watch(model, async (val) => {
  await editorReady
  const view = editorView || mergeView?.b
  if (view && val != view.state.doc.toString()) {
    internalUpdate = false
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: val,
      },
    })
  }
})

let editorView: EditorView
let mergeView: MergeView
const themeCompartment = new Compartment()
const domRef = useTemplateRef('domRef')
const appSettings = useAppSettingsStore()

const onChange = debounce((content: string) => {
  if (internalUpdate) {
    model.value = content
    emit('change', content)
  }
  internalUpdate = true
}, 300)

const formatDoc = async (view: EditorView) => {
  const content = view.state.doc.toString()
  const cursor = view.state.selection.ranges[0]?.from || 0
  try {
    const parser = { javascript: 'babel', yaml: 'yaml', json: 'json' }[lang]
    const plugins = {
      javascript: [parserBabel, estreePlugin],
      yaml: [parserYaml],
      json: [parserBabel, estreePlugin],
    }[lang]
    const { formatted, cursorOffset } = await prettier.formatWithCursor(content, {
      cursorOffset: cursor,
      parser,
      plugins,
      // https://github.com/GUI-for-Cores/Plugin-Hub/blob/main/.prettierrc.json
      semi: false,
      tabWidth: 2,
      singleQuote: true,
      printWidth: 160,
      trailingComma: 'none',
    })
    if (content !== formatted) {
      view.dispatch({
        changes: { from: 0, to: content.length, insert: formatted },
        selection: { anchor: cursorOffset, head: cursorOffset },
      })
    }
  } catch (error: any) {
    message.error(error.message || error)
  }
}

watch(
  () => appSettings.themeMode,
  (theme) => {
    const views = editorView ? [editorView] : [mergeView.a, mergeView.b]
    views.forEach((view) => {
      view.dispatch({
        effects: themeCompartment.reconfigure(
          theme === Theme.Dark ? [EditorView.theme({}, { dark: true }), oneDark] : [],
        ),
      })
    })
  },
)

let timer: number
onMounted(() => (timer = setTimeout(() => initEditor(), inject(IS_IN_MODAL, false) ? 100 : 0)))
onUnmounted(() => {
  clearTimeout(timer)
  const view = editorView || mergeView
  view?.destroy()
})

const initEditor = () => {
  domRef.value!.innerHTML = ''

  const extensions = [
    basicSetup,
    // Keymap
    keymap.of([
      indentWithTab,
      {
        key: 'Shift-Alt-f',
        run: (v: EditorView) => {
          formatDoc(v)
          return true
        },
      },
    ]),
    // Code wrap
    EditorView.lineWrapping,
    // Placeholder
    Placeholder(placeholder),
    // Theme
    themeCompartment.of(
      appSettings.themeMode === Theme.Dark ? [EditorView.theme({}, { dark: true }), oneDark] : [],
    ),
    ...(lang === 'javascript' ? [autocompletion({ override: getCompletions(plugin) })] : []),
    // Lint
    ...(lang === 'json' ? [linter(jsonParseLinter())] : []),
    // Lang
    ...(['javascript', 'json', 'yaml'].includes(lang) ? [{ javascript, json, yaml }[lang]()] : []),
    EditorView.updateListener.of((update) => {
      update.docChanged && onChange(update.state.doc.toString())
    }),
  ]

  if (mode === 'editor') {
    editorView = new EditorView({
      doc: model.value,
      parent: domRef.value!,
      extensions: [...extensions, EditorView.editable.of(editable)],
    })
  } else {
    mergeView = new MergeView({
      parent: domRef.value!,
      a: {
        doc: model.value,
        extensions: [...extensions, EditorView.editable.of(false)],
      },
      b: {
        doc: model.value,
        extensions: [...extensions, EditorView.editable.of(editable)],
      },
    })
  }

  markEditorReady(null)
}
</script>

<template>
  <div ref="domRef" @keydown.esc.stop @keydown.esc.prevent>
    <div class="flex justify-center">
      <Button loading type="link" />
    </div>
  </div>
</template>

<style lang="less" scoped>
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-scroller) {
  font-family: monaco, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
}
:deep(.cm-focused) {
  outline: none;
}
</style>
