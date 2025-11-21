import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useCategories } from '../hooks/useCategories'
import { memeService } from '../services/memeService'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, SUPPORTED_FILE_TYPES } from '../utils/constants'
import { formatFileSize } from '../utils/format'

interface FileWithPreview {
  file: File
  preview: string
  displayName: string
  categories: string[]
}

export default function Upload() {
  const navigate = useNavigate()
  const { categories, createCategory } = useCategories()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: SUPPORTED_FILE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES_PER_UPLOAD,
    onDrop: (acceptedFiles) => {
      const filesWithPreview = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        displayName: file.name,
        categories: [],
      }))
      setFiles(filesWithPreview)
    },
  })

  const updateFileName = (index: number, name: string) => {
    const updatedFiles = [...files]
    updatedFiles[index] = { ...updatedFiles[index], displayName: name }
    setFiles(updatedFiles)
  }

  const toggleCategory = (fileIndex: number, category: string) => {
    const updatedFiles = [...files]
    const currentCategories = updatedFiles[fileIndex].categories
    updatedFiles[fileIndex] = {
      ...updatedFiles[fileIndex],
      categories: currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category],
    }
    setFiles(updatedFiles)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
  }

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowCategoryModal(false)
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    setProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const fileWithPreview = files[i]
        const file = fileWithPreview.file
        
        // Get presigned URL
        const { uploadUrl, fileUrl, memeId } = await memeService.getPresignedUrl(
          fileWithPreview.displayName,
          file.type
        )

        // Upload to S3
        await memeService.uploadToS3(uploadUrl, file)

        // Create meme record
        await memeService.createMeme({
          memeId,
          name: fileWithPreview.displayName,
          url: fileUrl,
          categories: fileWithPreview.categories,
        })

        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      toast.success(`${files.length} meme${files.length > 1 ? 's' : ''} uploadé${files.length > 1 ? 's' : ''} avec succès !`)
      
      // Navigate to my memes
      navigate('/my-memes')
    } catch (error: any) {
      console.error('Upload failed:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Erreur lors de l\'upload. Veuillez réessayer.'
      
      // Handle different error formats
      if (error.response?.data) {
        const data = error.response.data
        
        // Pydantic validation error (array of errors)
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => err.msg || err.message).join(', ')
        }
        // String detail
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail
        }
        // Generic message
        else if (data.message) {
          errorMessage = data.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Uploader des memes</h1>
          <p className="text-gray-600 mb-8">
            Sélectionnez jusqu'à {MAX_FILES_PER_UPLOAD} fichiers (max {formatFileSize(MAX_FILE_SIZE)} chacun)
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-hq-blue bg-hq-blue-50'
                : 'border-gray-300 hover:border-hq-blue'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? 'Déposez vos fichiers ici'
                    : 'Glissez-déposez vos fichiers ici'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou cliquez pour parcourir vos fichiers
                </p>
              </div>
              <p className="text-xs text-gray-400">
                PNG, JPEG, WebP, GIF • Max {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configurer vos memes ({files.length})
            </h1>
            <p className="text-gray-600">
              Ajoutez un nom et des catégories pour chaque meme
            </p>
          </div>

          {/* All files in a vertical list */}
          <div className="space-y-4 mb-6">
            {files.map((fileWithPreview, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-4"
              >
                <div className="grid md:grid-cols-[200px_1fr] gap-4">
                  {/* Preview - More compact */}
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={fileWithPreview.preview}
                          alt={fileWithPreview.displayName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {formatFileSize(fileWithPreview.file.size)}
                    </p>
                  </div>

                  {/* Form - More compact */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Meme #{index + 1}</label>
                      <Input
                        value={fileWithPreview.displayName || ''}
                        onChange={(e) => updateFileName(index, e.target.value)}
                        placeholder="Nom du meme"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Catégories</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-xs"
                        >
                          + Nouvelle
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((category) => (
                          <Badge
                            key={category.categoryId}
                            variant={
                              fileWithPreview.categories.includes(category.name) ? 'primary' : 'secondary'
                            }
                          >
                            <button onClick={() => toggleCategory(index, category.name)}>
                              {category.name}
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upload button */}
          <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <Button 
              onClick={handleUpload} 
              isLoading={uploading} 
              className="w-full"
              size="lg"
              disabled={files.length === 0}
            >
              {uploading ? `Upload en cours... ${progress}%` : `Uploader ${files.length} meme${files.length > 1 ? 's' : ''}`}
            </Button>
            
            {uploading && (
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-hq-blue"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* New Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Nouvelle catégorie"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom de la catégorie"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Ex: Drôle, Travail, Actualité..."
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateCategory} className="flex-1">
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

