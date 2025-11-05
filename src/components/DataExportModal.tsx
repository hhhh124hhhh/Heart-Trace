import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, FileText, Database } from 'lucide-react';
import { exportDB, type ExportOptions, type ExportData } from '../lib/storage';
import { recordsDB } from '../lib/storage';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState<'all' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [preview, setPreview] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取最早和最晚记录日期
  useEffect(() => {
    const loadDateRange = async () => {
      const records = await recordsDB.getAll();
      if (records.length > 0) {
        const latestRecord = records[0];
        const earliestRecord = records[records.length - 1];
        
        setStartDate(earliestRecord.date.split('T')[0]);
        setEndDate(latestRecord.date.split('T')[0]);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
      }
    };

    if (isOpen) {
      loadDateRange();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, exportFormat, dateRange, startDate, endDate, includeSettings, includeStats]);

  const loadPreview = async () => {
    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeSettings,
        includeStats,
      };

      if (dateRange === 'range' && startDate && endDate) {
        options.dateRange = {
          start: new Date(startDate).toISOString(),
          end: new Date(endDate + 'T23:59:59.999Z').toISOString(),
        };
      }

      const data = await exportDB.getExportData(options);
      setPreview(data);
      setError(null);
    } catch (err) {
      setError('预览数据加载失败');
      console.error('Preview load error:', err);
    }
  };

  const handleExport = async () => {
    if (!preview) return;

    setIsExporting(true);
    setError(null);

    try {
      // 生成文件内容
      let content: string;
      if (exportFormat === 'json') {
        content = exportDB.toJSON(preview);
      } else {
        content = exportDB.toCSV(preview);
      }

      // 创建下载链接
      const blob = new Blob([content], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportDB.generateFileName(exportFormat);
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理
      URL.revokeObjectURL(url);
      
      // 延迟关闭模态框
      setTimeout(() => {
        onClose();
        setIsExporting(false);
      }, 1000);
      
    } catch (err) {
      setError('导出失败，请重试');
      setIsExporting(false);
      console.error('Export error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-16">
      <div className="bg-white rounded-2xl shadow-xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-24 border-b border-neutral-mist">
          <div className="flex items-center gap-12">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-h2 font-semibold text-neutral-dark">数据导出</h2>
          </div>
          <button
            onClick={onClose}
            className="p-8 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <X className="w-6 h-6 text-neutral-stone" />
          </button>
        </div>

        <div className="p-24 space-y-24">
          {/* 导出格式选择 */}
          <div>
            <h3 className="text-body font-medium text-neutral-dark mb-16">导出格式</h3>
            <div className="flex gap-12">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 p-16 rounded-xl border-2 transition-all ${
                  exportFormat === 'json'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-neutral-mist bg-white text-neutral-dark hover:border-neutral-300'
                }`}
              >
                <Database className="w-8 h-8 mb-8 mx-auto" />
                <div className="text-body-small font-medium">JSON</div>
                <div className="text-body-small text-neutral-stone mt-4">完整数据格式</div>
              </button>
              
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex-1 p-16 rounded-xl border-2 transition-all ${
                  exportFormat === 'csv'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-neutral-mist bg-white text-neutral-dark hover:border-neutral-300'
                }`}
              >
                <FileText className="w-8 h-8 mb-8 mx-auto" />
                <div className="text-body-small font-medium">CSV</div>
                <div className="text-body-small text-neutral-stone mt-4">表格分析格式</div>
              </button>
            </div>
          </div>

          {/* 时间范围选择 */}
          <div>
            <h3 className="text-body font-medium text-neutral-dark mb-16">时间范围</h3>
            <div className="space-y-12">
              <button
                onClick={() => setDateRange('all')}
                className={`w-full p-16 rounded-xl border-2 text-left transition-all ${
                  dateRange === 'all'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-neutral-mist bg-white text-neutral-dark hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-12">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <div className="text-body-small font-medium">全部时间</div>
                    <div className="text-body-small text-neutral-stone">
                      导出所有记录 ({preview?.exportInfo.totalRecords || 0} 条)
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDateRange('range')}
                className={`w-full p-16 rounded-xl border-2 text-left transition-all ${
                  dateRange === 'range'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-neutral-mist bg-white text-neutral-dark hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-12 mb-12">
                  <Calendar className="w-6 h-6" />
                  <div className="text-body-small font-medium">自定义时间范围</div>
                </div>
                
                {dateRange === 'range' && (
                  <div className="flex gap-12 ml-18">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-12 py-8 rounded-lg border border-neutral-mist focus:border-primary-500 focus:outline-none"
                    />
                    <span className="self-center text-neutral-stone">至</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="flex-1 px-12 py-8 rounded-lg border border-neutral-mist focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 附加选项 */}
          <div>
            <h3 className="text-body font-medium text-neutral-dark mb-16">附加选项</h3>
            <div className="space-y-12">
              <label className="flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSettings}
                  onChange={(e) => setIncludeSettings(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="text-body-small font-medium">包含设置信息</div>
                  <div className="text-body-small text-neutral-stone">导出标签、个人设置等</div>
                </div>
              </label>

              <label className="flex items-center gap-12 p-12 rounded-lg hover:bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="text-body-small font-medium">包含统计信息</div>
                  <div className="text-body-small text-neutral-stone">导出情绪分布、连续天数等</div>
                </div>
              </label>
            </div>
          </div>

          {/* 预览信息 */}
          {preview && (
            <div className="p-16 rounded-xl bg-neutral-50">
              <h4 className="text-body-small font-medium text-neutral-dark mb-8">导出预览</h4>
              <div className="space-y-4 text-body-small text-neutral-stone">
                <div>记录数量: {preview.exportInfo.totalRecords} 条</div>
                <div>时间范围: {new Date(preview.exportInfo.dateRange.start).toLocaleDateString('zh-CN')} 至 {new Date(preview.exportInfo.dateRange.end).toLocaleDateString('zh-CN')}</div>
                <div>文件格式: {exportFormat.toUpperCase()}</div>
                <div>预计大小: {exportFormat === 'json' 
                  ? `~${(JSON.stringify(preview).length / 1024).toFixed(1)}KB`
                  : `~${(exportDB.toCSV(preview).length / 1024).toFixed(1)}KB`
                }</div>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="p-16 rounded-xl bg-red-50 text-red-600 text-body-small">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-12 pt-8">
            <button
              onClick={onClose}
              className="flex-1 px-24 py-16 rounded-full border-2 border-neutral-mist text-neutral-dark hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !preview}
              className="flex-1 px-24 py-16 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-8"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  导出数据
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};