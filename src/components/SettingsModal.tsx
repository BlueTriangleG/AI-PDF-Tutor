import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Settings, X, Plus, Info, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { SystemPromptTemplate } from '../types'
import { useChat } from '../contexts/ChatContext'

interface SettingsModalProps {
  apiKey: string
  onSaveApiKey: (key: string) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  onSaveApiKey,
}) => {
  const {
    systemPrompt,
    setSystemPrompt,
    availablePrompts,
    addCustomPrompt,
    selectedModel,
    setSelectedModel,
    testApiConnection,
    availableModels,
    refreshModels,
  } = useChat()

  const [isOpen, setIsOpen] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [selectedPromptId, setSelectedPromptId] = useState(systemPrompt.id)
  const [selectedModelId, setSelectedModelId] = useState(
    selectedModel || 'gpt-3.5-turbo'
  )
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptContent, setNewPromptContent] = useState('')
  const [showModelInfo, setShowModelInfo] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'untested' | 'success' | 'error'
  >('untested')
  const [connectionError, setConnectionError] = useState<string>('')
  const [isRefreshingModels, setIsRefreshingModels] = useState(false)

  useEffect(() => {
    if (isOpen && tempApiKey) {
      refreshModels()
    }
  }, [isOpen, tempApiKey])

  const handleSave = () => {
    onSaveApiKey(tempApiKey)
    const selectedPrompt = availablePrompts.find(
      (p) => p.id === selectedPromptId
    )
    if (selectedPrompt) {
      setSystemPrompt(selectedPrompt)
    }
    setSelectedModel(selectedModelId)
    setIsOpen(false)
  }

  const handleAddPrompt = () => {
    if (newPromptName && newPromptContent) {
      addCustomPrompt({
        id: Date.now().toString(),
        name: newPromptName,
        prompt: newPromptContent,
      })
      setNewPromptName('')
      setNewPromptContent('')
      setIsAddingPrompt(false)
    }
  }

  const handleTestConnection = async () => {
    if (!tempApiKey || !tempApiKey.startsWith('sk-')) {
      setConnectionStatus('error')
      setConnectionError(
        'Please enter a valid OpenAI API key (starts with "sk-").'
      )
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('untested')
    setConnectionError('')

    try {
      // First, try to refresh models with the new API key
      if (filteredModels.length === 0) {
        await handleRefreshModels()
      }

      // Use gpt-3.5-turbo as default if no model selected
      const modelToTest = selectedModelId || 'gpt-3.5-turbo'

      const success = await testApiConnection(tempApiKey, modelToTest)
      setConnectionStatus(success ? 'success' : 'error')
      if (!success) {
        setConnectionError(
          'Connection failed. Please check your API key and internet connection. See browser console for detailed errors.'
        )
      } else {
        // If successful and no model was selected, select gpt-3.5-turbo
        if (!selectedModelId) {
          setSelectedModelId('gpt-3.5-turbo')
        }
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionError(
        `Connection test failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }

    setIsTestingConnection(false)
  }

  const handleRefreshModels = async () => {
    if (!tempApiKey || !tempApiKey.startsWith('sk-')) {
      return
    }

    setIsRefreshingModels(true)

    // Temporarily set the API key to enable model refresh
    const originalApiKey = apiKey
    onSaveApiKey(tempApiKey)

    try {
      await refreshModels()
    } catch (error) {
      console.error('Failed to refresh models:', error)
    } finally {
      // Restore original API key if it was different
      if (originalApiKey !== tempApiKey) {
        onSaveApiKey(originalApiKey)
      }
      setIsRefreshingModels(false)
    }
  }

  const filteredModels = Array.isArray(availableModels)
    ? availableModels
        .filter(
          (model) =>
            model.id.startsWith('gpt-') && !model.id.includes('instruct')
        )
        .sort((a, b) => a.id.localeCompare(b.id))
    : []

  // Auto-select gpt-3.5-turbo if no model is selected and models are available
  React.useEffect(() => {
    if (filteredModels.length > 0 && !selectedModelId) {
      const defaultModel =
        filteredModels.find((m) => m.id === 'gpt-3.5-turbo') ||
        filteredModels[0]
      setSelectedModelId(defaultModel.id)
    }
  }, [filteredModels, selectedModelId])

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
          <Settings className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                OpenAI API Key
              </label>
              <div className="flex space-x-2">
                <Input
                  id="apiKey"
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sk-..."
                  fullWidth
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  isLoading={isTestingConnection}
                  disabled={!tempApiKey}>
                  Test
                </Button>
              </div>
              {connectionStatus !== 'untested' && (
                <p
                  className={`mt-1 text-sm ${
                    connectionStatus === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                  {connectionStatus === 'success'
                    ? 'Connection successful!'
                    : connectionError ||
                      'Connection failed. Please check your API key and selected model.'}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  GPT Model
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshModels}
                  isLoading={isRefreshingModels}
                  disabled={!tempApiKey || !tempApiKey.startsWith('sk-')}
                  className="h-8 w-8 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {filteredModels.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {!tempApiKey || !tempApiKey.startsWith('sk-')
                    ? 'Enter your API key above and click refresh to load models.'
                    : 'No models available. Click refresh to load models.'}
                </p>
              )}
              <div className="space-y-2">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors relative ${
                      selectedModelId === model.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedModelId(model.id)}>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {model.id}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {model.owned_by}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                AI Tutor Personality
              </label>
              <div className="space-y-2">
                {availablePrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedPromptId === prompt.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedPromptId(prompt.id)}>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {prompt.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {prompt.prompt}
                    </div>
                  </div>
                ))}
              </div>

              {!isAddingPrompt ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsAddingPrompt(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom Prompt
                </Button>
              ) : (
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Prompt Name"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    fullWidth
                  />
                  <textarea
                    className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="System prompt content..."
                    value={newPromptContent}
                    onChange={(e) => setNewPromptContent(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingPrompt(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddPrompt}>
                      Add Prompt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
