import { useRef } from 'react'
import { useTreeStore } from '../stores/treeStore'
import { UserPlus, Link2, Upload, Download, Layout, Trash2, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

export default function TreeToolbar({ onAddPerson, onAddRelation, onAutoLayout }) {
  const { importVCF, exportVCF, loading, fetchTree } = useTreeStore()
  const fileRef = useRef()

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    await importVCF(file)
    e.target.value = ''
  }

  const btnBase = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={onAddPerson}
        className={clsx(btnBase, 'bg-bark-700 hover:bg-bark-800 text-parchment shadow-sm')}>
        <UserPlus size={15} /> <span className="hidden sm:inline">Add Person</span>
      </button>

      <button onClick={onAddRelation}
        className={clsx(btnBase, 'bg-leaf-600 hover:bg-leaf-700 text-white shadow-sm')}>
        <Link2 size={15} /> <span className="hidden sm:inline">Link Relation</span>
      </button>

      <div className="h-6 w-px bg-bark-200 mx-1" />

      <button onClick={onAutoLayout}
        className={clsx(btnBase, 'bg-white hover:bg-bark-50 text-bark-700 border border-bark-200 shadow-sm')}>
        <Layout size={15} /> <span className="hidden sm:inline">Auto Layout</span>
      </button>

      <button onClick={fetchTree} disabled={loading}
        className={clsx(btnBase, 'bg-white hover:bg-bark-50 text-bark-700 border border-bark-200 shadow-sm', loading && 'opacity-60')}>
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      <div className="h-6 w-px bg-bark-200 mx-1" />

      <input ref={fileRef} type="file" accept=".vcf" className="hidden" onChange={handleImport} />
      <button onClick={() => fileRef.current?.click()}
        className={clsx(btnBase, 'bg-white hover:bg-bark-50 text-bark-700 border border-bark-200 shadow-sm')}>
        <Upload size={15} /> <span className="hidden sm:inline">Import VCF</span>
      </button>

      <button onClick={exportVCF}
        className={clsx(btnBase, 'bg-white hover:bg-bark-50 text-bark-700 border border-bark-200 shadow-sm')}>
        <Download size={15} /> <span className="hidden sm:inline">Export VCF</span>
      </button>
    </div>
  )
}
