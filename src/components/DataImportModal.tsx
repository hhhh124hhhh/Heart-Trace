import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { recordsDB, tagsDB, settingsDB, statsDB, recordStore, tagStore, DEFAULT_TAGS } from '../lib/storage';
import type { ExportData } from '../lib/storage';
import type { DailyRecord, Tag, UserSettings, UserStats } from '../types';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface ImportPreview {
  data: ExportData;
  newRecords: number;
  duplicateRecords: number;
  newTags: number;
  duplicateTags: number;
  isValid: boolean;
  error?: string;
}

type ImportStrategy = 'skip' | 'merge' | 'overwrite';
type ImportOptions = {
  importRecords: boolean;
  importTags: boolean;
  importSettings: boolean;
  importStats: boolean;
  strategy: ImportStrategy;
};

export const DataImportModal: React.FC<DataImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportComplete 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    importRecords: true,
    importTags: true,
    importSettings: false,
    importStats: false,
    strategy: 'skip'
  });
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (jsonFile) {
      handleFileSelect(jsonFile);
    } else {
      setPreview({
        data: {} as ExportData,
        newRecords: 0,
        duplicateRecords: 0,
        newTags: 0,
        duplicateTags: 0,
        isValid: false,
        error: '请选择JSON格式的文件'
      });
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setImportResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // 验证数据格式
        validateImportData(data).then(validation => {
          setPreview(validation);
        }).catch(error => {
          setPreview({
            data: {} as ExportData,
            newRecords: 0,
            duplicateRecords: 0,
            newTags: 0,
            duplicateTags: 0,
            isValid: false,
            error: `验证过程出错: ${error instanceof Error ? error.message : '未知错误'}`
          });
        }).finally(() => {
          setIsProcessing(false);
        });
      } catch (error) {
        setPreview({
          data: {} as ExportData,
          newRecords: 0,
          duplicateRecords: 0,
          newTags: 0,
          duplicateTags: 0,
          isValid: false,
          error: `文件格式无效: ${error instanceof Error ? error.message : 'JSON解析失败'}`
        });
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setPreview({
        data: {} as ExportData,
        newRecords: 0,
        duplicateRecords: 0,
        newTags: 0,
        duplicateTags: 0,
        isValid: false,
        error: '文件读取失败，请重试'
      });
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const validateImportData = async (data: ExportData): Promise<ImportPreview> => {
    try {
      // 检查必要字段
      if (!data.exportInfo || !data.records || !Array.isArray(data.records)) {
        return {
          data,
          newRecords: 0,
          duplicateRecords: 0,
          newTags: 0,
          duplicateTags: 0,
          isValid: false,
          error: '文件格式不正确，缺少必要的数据字段'
        };
      }

      // 获取现有数据进行对比
      const existingRecords = await recordsDB.getAll();
      const existingTags = await tagsDB.getAll();
      const existingRecordIds = new Set(existingRecords.map(r => r.id));
      const existingTagIds = new Set(existingTags.map(t => t.id));

      // 分析数据
      let newRecords = 0;
      let duplicateRecords = 0;
      let newTags = 0;
      let duplicateTags = 0;

      data.records.forEach(record => {
        if (existingRecordIds.has(record.id)) {
          duplicateRecords++;
        } else {
          newRecords++;
        }
      });

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach(tag => {
          if (existingTagIds.has(tag.id)) {
            duplicateTags++;
          } else {
            newTags++;
          }
        });
      }

      return {
        data,
        newRecords,
        duplicateRecords,
        newTags,
        duplicateTags,
        isValid: true
      };
    } catch (error) {
      return {
        data,
        newRecords: 0,
        duplicateRecords: 0,
        newTags: 0,
        duplicateTags: 0,
        isValid: false,
        error: `数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  };

  const handleImport = async () => {
    if (!preview || !preview.isValid) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const results = {
        recordsImported: 0,
        recordsSkipped: 0,
        tagsImported: 0,
        tagsSkipped: 0,
        settingsImported: false,
        statsImported: false
      };

      // 如果是完全覆盖策略，先清空现有数据
      if (importOptions.strategy === 'overwrite') {
        try {
          // 清空所有记录
          const allRecords = await recordsDB.getAll();
          for (const record of allRecords) {
            await recordStore.removeItem(record.id);
          }
          
          // 清空所有标签（保留默认标签）
          await tagStore.setItem('tags', DEFAULT_TAGS);
          
        } catch (error) {
          setImportResult({
            success: false,
            message: '清空现有数据失败，请重试',
            details: error
          });
          setIsImporting(false);
          return;
        }
      }

      // 导入记录
      if (importOptions.importRecords && preview.data.records) {
        for (const record of preview.data.records) {
          try {
            // 确保记录有必要的字段
            const validatedRecord = {
              ...record,
              // 确保这些字段存在，如果不存在则使用默认值
              id: record.id || `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              date: record.date || new Date().toISOString(),
              createdAt: record.createdAt || Date.now(),
              content: record.content || '',
              tags: Array.isArray(record.tags) ? record.tags : [],
              isPrivate: Boolean(record.isPrivate),
              isFavorite: Boolean(record.isFavorite),
            };

            const existingRecord = await recordsDB.getById(validatedRecord.id);
            
            if (existingRecord) {
              switch (importOptions.strategy) {
                case 'skip':
                  results.recordsSkipped++;
                  break;
                case 'merge':
                  await recordsDB.update(validatedRecord.id, validatedRecord);
                  results.recordsImported++;
                  break;
                case 'overwrite':
                  await recordsDB.delete(validatedRecord.id);
                  // 直接存储，不使用create方法避免重新生成ID和时间
                  await recordStore.setItem(validatedRecord.id, validatedRecord);
                  results.recordsImported++;
                  break;
              }
            } else {
              // 直接存储，不使用create方法避免重新生成ID和时间
              await recordStore.setItem(validatedRecord.id, validatedRecord);
              results.recordsImported++;
            }
          } catch (error) {
            console.error('Error importing record:', error);
            results.recordsSkipped++;
          }
        }
      }

      // 导入标签
      if (importOptions.importTags && preview.data.tags) {
        for (const tag of preview.data.tags) {
          try {
            // 确保标签有必要的字段
            const validatedTag = {
              ...tag,
              id: tag.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: tag.name || '未命名标签',
              color: tag.color || 'linear-gradient(135deg, #667eea, #764ba2)',
              isCustom: Boolean(tag.isCustom),
            };

            const existingTag = await tagsDB.getById(validatedTag.id);
            
            if (!existingTag) {
              // 新标签，直接添加
              await tagsDB.add(validatedTag);
              results.tagsImported++;
            } else {
              // 存在重复标签，根据策略处理
              switch (importOptions.strategy) {
                case 'skip':
                  results.tagsSkipped++;
                  break;
                case 'merge':
                  // 合并更新标签信息
                  await tagsDB.update(validatedTag.id, validatedTag);
                  results.tagsImported++;
                  break;
                case 'overwrite':
                  // 完全覆盖：先删除现有标签，再添加新标签
                  await tagsDB.delete(validatedTag.id);
                  // 直接存储到tagStore，避免add方法重新生成ID
                  await tagStore.setItem(validatedTag.id, validatedTag);
                  results.tagsImported++;
                  break;
              }
            }
          } catch (error) {
            console.error('Error importing tag:', error);
            results.tagsSkipped++;
          }
        }
      }

      // 导入设置
      if (importOptions.importSettings && preview.data.settings) {
        try {
          // 获取现有设置
          const existingSettings = await settingsDB.get();
          
          if (importOptions.strategy === 'overwrite') {
            // 完全覆盖：直接使用导入的设置
            await settingsDB.update(preview.data.settings);
          } else {
            // 合并策略：保留现有设置，只更新导入的设置
            const mergedSettings = {
              ...existingSettings,
              ...preview.data.settings,
            };
            await settingsDB.update(mergedSettings);
          }
          
          results.settingsImported = true;
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      }

      // 导入统计（重新计算）
      if (importOptions.importStats) {
        try {
          await statsDB.calculateStats();
          results.statsImported = true;
        } catch (error) {
          console.error('Error importing stats:', error);
        }
      }

      setImportResult({
        success: true,
        message: '数据导入成功！',
        details: results
      });

      // 重新计算统计数据
      await statsDB.calculateStats();

      // 触发全局数据刷新事件
      window.dispatchEvent(new CustomEvent('data-imported', { 
        detail: { 
          recordsImported: results.recordsImported,
          tagsImported: results.tagsImported,
          settingsImported: results.settingsImported
        }
      }));

      // 延迟关闭并刷新
      setTimeout(() => {
        onClose();
        onImportComplete?.();
      }, 2000);

    } catch (error) {
      setImportResult({
        success: false,
        message: '导入失败，请重试',
        details: error
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
    setIsProcessing(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-16">
      <div className="bg-white rounded-2xl shadow-xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-24 border-b border-neutral-mist">
          <div className="flex items-center gap-12">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-h2 font-semibold text-neutral-dark">数据导入</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-8 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <X className="w-6 h-6 text-neutral-stone" />
          </button>
        </div>

        <div className="p-24 space-y-24">
          {/* 文件上传区域 */}
          {!preview && (
            <div>
              <h3 className="text-body font-medium text-neutral-dark mb-16">选择备份文件</h3>
              <div
                className={`border-2 border-dashed rounded-xl p-32 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-mist hover:border-neutral-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-12">
                    <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-body text-neutral-stone">正在解析文件...</div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <Upload className="w-12 h-12 text-neutral-stone mx-auto" />
                    <div>
                      <div className="text-body text-neutral-dark mb-4">
                        拖拽JSON文件到这里，或点击选择文件
                      </div>
                      <div className="text-body-small text-neutral-stone">
                        仅支持从心迹导出的JSON格式文件
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-24 py-12 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      选择文件
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 预览和错误信息 */}
          {preview && (
            <div>
              {preview.isValid ? (
                <div className="space-y-16">
                  <div className="p-16 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-8 mb-8">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-body font-medium text-green-700">文件验证通过</span>
                    </div>
                    <div className="text-body-small text-green-600">
                      {selectedFile?.name}
                    </div>
                  </div>

                  {/* 导入预览 */}
                  <div className="p-16 rounded-xl bg-neutral-50">
                    <h4 className="text-body-small font-medium text-neutral-dark mb-8">导入预览</h4>
                    <div className="space-y-4 text-body-small text-neutral-stone">
                      <div>导出时间: {new Date(preview.data.exportInfo.exportDate).toLocaleString('zh-CN')}</div>
                      <div>记录数量: {preview.data.records.length} 条</div>
                      <div>标签数量: {preview.data.tags?.length || 0} 个</div>
                      <div>时间范围: {new Date(preview.data.exportInfo.dateRange.start).toLocaleDateString('zh-CN')} 至 {new Date(preview.data.exportInfo.dateRange.end).toLocaleDateString('zh-CN')}</div>
                      
                      {(preview.newRecords > 0 || preview.duplicateRecords > 0) && (
                        <div className="pt-8 border-t border-neutral-200">
                          <div className="text-green-600">新记录: {preview.newRecords} 条</div>
                          <div className="text-orange-600">重复记录: {preview.duplicateRecords} 条</div>
                          {preview.data.tags && (
                            <>
                              <div className="text-green-600">新标签: {preview.newTags} 个</div>
                              <div className="text-orange-600">重复标签: {preview.duplicateTags} 个</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 导入选项 */}
                  <div>
                    <h4 className="text-body font-medium text-neutral-dark mb-16">导入选项</h4>
                    <div className="space-y-12">
                      <label className="flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importOptions.importRecords}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, importRecords: e.target.checked }))}
                          className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-body-small font-medium">导入记录</div>
                          <div className="text-body-small text-neutral-stone">导入心情记录和AI回应</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importOptions.importTags}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, importTags: e.target.checked }))}
                          className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-body-small font-medium">导入标签</div>
                          <div className="text-body-small text-neutral-stone">导入自定义情绪标签</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importOptions.importSettings}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, importSettings: e.target.checked }))}
                          className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-body-small font-medium">导入设置</div>
                          <div className="text-body-small text-neutral-stone">导入个人设置和配置</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 数据处理策略 */}
                  <div>
                    <h4 className="text-body font-medium text-neutral-dark mb-16">数据处理策略</h4>
                    <div className="space-y-8">
                      {[
                        { 
                          value: 'skip', 
                          label: '跳过重复数据', 
                          desc: '保留现有数据，只导入新的内容',
                          detail: '记录和标签：保留现有，跳过重复 | 设置：保持不变'
                        },
                        { 
                          value: 'merge', 
                          label: '合并更新', 
                          desc: '将新数据与现有数据合并',
                          detail: '记录和标签：更新重复内容 | 设置：合并配置'
                        },
                        { 
                          value: 'overwrite', 
                          label: '完全覆盖', 
                          desc: '清空现有数据，导入所有内容',
                          detail: '⚠️ 警告：将删除所有现有记录和设置！',
                          warning: true
                        }
                      ].map((option) => (
                        <label key={option.value} className={`
                          flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer
                          ${importOptions.strategy === option.value ? 'bg-neutral-50' : ''}
                          ${option.warning ? 'border-2 border-red-200' : ''}
                        `}>
                          <input
                            type="radio"
                            name="strategy"
                            value={option.value}
                            checked={importOptions.strategy === option.value}
                            onChange={(e) => setImportOptions(prev => ({ ...prev, strategy: e.target.value as ImportStrategy }))}
                            className="w-5 h-5 text-blue-500 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-8">
                              <div className="text-body-small font-medium">{option.label}</div>
                              {option.warning && (
                                <span className="px-6 py-2 bg-red-100 text-red-600 rounded-full text-xs">
                                  高风险
                                </span>
                              )}
                            </div>
                            <div className="text-body-small text-neutral-stone mt-4">{option.desc}</div>
                            <div className="text-body-small text-neutral-earth mt-2">{option.detail}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {importOptions.strategy === 'overwrite' && (
                      <div className="p-12 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center gap-8 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-body-small font-medium">确认完全覆盖</span>
                        </div>
                        <div className="text-body-small text-red-500 mt-4">
                          此操作将清空所有现有数据（记录、标签、设置），请确保已备份重要数据。
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-16 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-8 mb-8">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-body font-medium text-red-700">文件验证失败</span>
                  </div>
                  <div className="text-body-small text-red-600">
                    {preview.error}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-12 pt-8">
                <button
                  onClick={() => {
                    resetModal();
                    setPreview(null);
                  }}
                  className="flex-1 px-24 py-16 rounded-full border-2 border-neutral-mist text-neutral-dark hover:bg-neutral-50 transition-colors"
                >
                  重新选择
                </button>
                
                {preview.isValid && (
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex-1 px-24 py-16 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-8"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        开始导入
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className={`p-16 rounded-xl ${
              importResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-8 mb-8">
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-body font-medium ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {importResult.message}
                </span>
              </div>
              
              {importResult.success && importResult.details && (
                <div className="text-body-small text-green-600 space-y-2">
                  <div>记录导入: {importResult.details.recordsImported} 条</div>
                  {importResult.details.recordsSkipped > 0 && (
                    <div>记录跳过: {importResult.details.recordsSkipped} 条</div>
                  )}
                  <div>标签导入: {importResult.details.tagsImported} 个</div>
                  {importResult.details.settingsImported && (
                    <div>设置已更新</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};