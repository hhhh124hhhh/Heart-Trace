// 周总结测试组件
import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, BarChart3, Calendar } from 'lucide-react';
import { 
  runAllWeeklyTests, 
  testWeeklyStats, 
  testDifferentWeeks, 
  testWeeklyReminder,
  generateTestRecords 
} from './test-weekly-summary';

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export const WeeklySummaryTestButton: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: TestResult }>({
    allTests: { status: 'idle', message: '运行所有测试' },
    weeklyStats: { status: 'idle', message: '测试周统计功能' },
    differentWeeks: { status: 'idle', message: '测试不同时间周' },
    reminder: { status: 'idle', message: '测试提醒功能' },
    generateData: { status: 'idle', message: '生成测试数据' }
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  const updateTestResult = (testKey: string, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => ({
      ...prev,
      [testKey]: { status, message, details }
    }));
  };

  const runTest = async (testKey: string, testFn: () => Promise<any>) => {
    updateTestResult(testKey, 'running', '正在运行测试...');
    
    try {
      const result = await testFn();
      updateTestResult(testKey, 'success', '测试通过', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      updateTestResult(testKey, 'error', `测试失败: ${errorMessage}`);
    }
  };

  const handleRunAllTests = async () => {
    await runTest('allTests', runAllWeeklyTests);
  };

  const handleTestWeeklyStats = async () => {
    await runTest('weeklyStats', testWeeklyStats);
  };

  const handleTestDifferentWeeks = async () => {
    await runTest('differentWeeks', testDifferentWeeks);
  };

  const handleTestReminder = async () => {
    await runTest('reminder', testWeeklyReminder);
  };

  const handleGenerateTestData = async () => {
    updateTestResult('generateData', 'running', '正在生成测试数据...');
    
    try {
      const records = generateTestRecords(7);
      updateTestResult('generateData', 'success', `成功生成 ${records.length} 条测试数据`, records);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      updateTestResult('generateData', 'error', `生成失败: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'idle':
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const TestButton: React.FC<{ 
    testKey: string; 
    onClick: () => void; 
    icon?: React.ReactNode;
    fullWidth?: boolean;
  }> = ({ testKey, onClick, icon, fullWidth = false }) => {
    const result = testResults[testKey];
    
    return (
      <button
        onClick={onClick}
        disabled={result.status === 'running'}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${fullWidth ? 'w-full justify-center' : ''} ${result.status === 'running' ? 'bg-blue-50 border-blue-200 cursor-not-allowed' : result.status === 'success' ? 'bg-green-50 border-green-200 hover:bg-green-100' : result.status === 'error' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
      >
        {getStatusIcon(result.status)}
        {icon || <BarChart3 className="w-4 h-4" />}
        <span className="text-sm">{result.message}</span>
      </button>
    );
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-shadow border border-gray-200"
          title="周总结测试工具"
        >
          <BarChart3 className="w-5 h-5 text-purple-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-semibold text-sm">周总结测试工具</h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="关闭"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 测试内容 */}
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {/* 快速测试 */}
        <div>
          <h4 className="text-xs font-medium text-neutral-dark mb-3 flex items-center gap-2">
            <Play className="w-3 h-3" />
            快速测试
          </h4>
          <div className="space-y-3">
            <TestButton 
              testKey="allTests" 
              onClick={handleRunAllTests}
              icon={<CheckCircle className="w-3 h-3" />}
              fullWidth={true}
            />
          </div>
        </div>

        {/* 详细测试 */}
        <div>
          <h4 className="text-xs font-medium text-neutral-dark mb-3 flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            详细测试
          </h4>
          <div className="space-y-3">
            <TestButton testKey="weeklyStats" onClick={handleTestWeeklyStats} />
            <TestButton testKey="differentWeeks" onClick={handleTestDifferentWeeks} />
            <TestButton testKey="reminder" onClick={handleTestReminder} />
          </div>
        </div>

        {/* 测试数据 */}
        <div>
          <h4 className="text-xs font-medium text-neutral-dark mb-3 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            测试数据
          </h4>
          <div className="space-y-3">
            <TestButton 
              testKey="generateData" 
              onClick={handleGenerateTestData}
              icon={<AlertCircle className="w-3 h-3" />}
              fullWidth={true}
            />
          </div>
        </div>

        {/* 测试结果显示 */}
        {Object.entries(testResults).some(([_, result]) => result.status !== 'idle') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-neutral-dark mb-3">测试结果</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto">
              {Object.entries(testResults).map(([key, result]) => (
                result.status !== 'idle' && (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.message}</div>
                      {result.details && typeof result.details !== 'object' && (
                        <div className="text-neutral-stone mt-1 text-xs">
                          {String(result.details)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-neutral-dark mb-3">使用说明</h4>
          <div className="text-xs text-neutral-stone space-y-1">
            <p>• 快速测试：运行所有相关测试</p>
            <p>• 详细测试：测试各功能模块</p>
            <p>• 测试数据：生成模拟数据</p>
            <p>• 测试结果：显示测试输出</p>
          </div>
        </div>
      </div>
    </div>
  );
};