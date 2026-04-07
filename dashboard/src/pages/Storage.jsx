import { useState, useEffect, useCallback, useRef } from 'react'
import { Image, FileText, Film, File, Upload, Trash2, Plus, HardDrive, FolderOpen } from 'lucide-react'
import api from '../lib/api'
import StatsCard from '../components/StatsCard'
import Modal from '../components/Modal'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileIcon(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('svg') || t.includes('webp')) return Image
  if (t.includes('video') || t.includes('mp4') || t.includes('mov') || t.includes('avi')) return Film
  if (t.includes('pdf') || t.includes('doc') || t.includes('txt') || t.includes('text') || t.includes('csv') || t.includes('xls') || t.includes('ppt')) return FileText
  return File
}

function getFileColor(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('svg') || t.includes('webp')) return 'text-purple-400 bg-purple-500/10'
  if (t.includes('video') || t.includes('mp4') || t.includes('mov') || t.includes('avi')) return 'text-pink-400 bg-pink-500/10'
  if (t.includes('pdf') || t.includes('doc') || t.includes('txt') || t.includes('text') || t.includes('csv') || t.includes('xls') || t.includes('ppt')) return 'text-blue-400 bg-blue-500/10'
  return 'text-[#7a7a8e] bg-white/5'
}

export default function Storage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const fileInputRef = useRef(null)

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.get('/api/files')
      setFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        await api.upload('/api/files/upload', formData)
      }
      await fetchFiles()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    try {
      await api.delete(`/api/files/${showDelete}`)
      setShowDelete(null)
      await fetchFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalStorage = files.reduce((sum, f) => sum + (f.size || 0), 0)
  const imageCount = files.filter((f) => {
    const t = (f.type || f.mimeType || f.mime_type || f.name || '').toLowerCase()
    return t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('svg') || t.includes('webp')
  }).length
  const docCount = files.filter((f) => {
    const t = (f.type || f.mimeType || f.mime_type || f.name || '').toLowerCase()
    return t.includes('pdf') || t.includes('doc') || t.includes('txt') || t.includes('text') || t.includes('csv') || t.includes('xls')
  }).length

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#7a7a8e]">Loading...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#eeeef0]">Storage</h1>
          <p className="text-[#7a7a8e] mt-1">Manage your files and media</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#4a6cf7] hover:bg-[#3a56d4] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Files" value={files.length} subtitle="Uploaded files" icon={File} />
        <StatsCard title="Storage Used" value={formatBytes(totalStorage)} subtitle="Total size" icon={HardDrive} />
        <StatsCard title="Images" value={imageCount} subtitle="Image files" icon={Image} />
        <StatsCard title="Documents" value={docCount} subtitle="Document files" icon={FileText} />
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => {
            const id = file._id || file.id
            const fileType = file.type || file.mimeType || file.mime_type || file.name || ''
            const IconComponent = getFileIcon(fileType)
            const colorClasses = getFileColor(fileType)
            return (
              <div
                key={id}
                className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${colorClasses} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => setShowDelete(id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-[#7a7a8e] hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-[#eeeef0] truncate mb-1" title={file.name || file.filename}>
                  {file.name || file.filename || 'Untitled'}
                </h3>
                <div className="flex items-center justify-between text-xs text-[#4a4a5e]">
                  <span>{formatBytes(file.size)}</span>
                  <span>{formatDate(file.created_at || file.createdAt || file.uploadedAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-[#4a4a5e] mx-auto mb-4 opacity-50" />
          <p className="text-[#7a7a8e] mb-1">No files uploaded yet</p>
          <p className="text-[#4a4a5e] text-sm">Upload your first file to get started.</p>
        </div>
      )}

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete File" size="sm">
        <p className="text-[#7a7a8e] mb-6">Are you sure you want to delete this file? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(null)} className="border border-white/[0.12] text-[#7a7a8e] hover:text-white hover:border-white/[0.2] rounded-lg px-4 py-2 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-red-500/20">
            Delete File
          </button>
        </div>
      </Modal>
    </div>
  )
}
