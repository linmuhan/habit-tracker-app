/**
 * 全局错误处理工具
 * 提供统一的错误处理和日志记录
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: number;
}

export class DatabaseError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'DB_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  field: string;
  
  constructor(message: string, field: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * 安全执行数据库操作
 * @param operation 数据库操作函数
 * @param fallbackValue 失败时的默认值
 * @param errorMessage 错误提示信息
 */
export async function safeDbOperation<T>(
  operation: () => T,
  fallbackValue: T,
  errorMessage: string = '操作失败'
): Promise<T> {
  try {
    return operation();
  } catch (error) {
    console.error(`[Database Error] ${errorMessage}:`, error);
    // 可以在这里添加错误上报（如 Sentry）
    return fallbackValue;
  }
}

/**
 * 同步版本的安全数据库操作
 */
export function safeDbOperationSync<T>(
  operation: () => T,
  fallbackValue: T,
  errorMessage: string = '操作失败'
): T {
  try {
    return operation();
  } catch (error) {
    console.error(`[Database Error] ${errorMessage}:`, error);
    return fallbackValue;
  }
}

/**
 * 验证输入数据
 */
export function validateInput(
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }
): { valid: boolean; error?: string } {
  if (options.required && (!value || value.trim() === '')) {
    return { valid: false, error: '此项为必填项' };
  }
  
  if (value) {
    if (options.minLength && value.length < options.minLength) {
      return { valid: false, error: `最少需要 ${options.minLength} 个字符` };
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      return { valid: false, error: `最多允许 ${options.maxLength} 个字符` };
    }
    
    if (options.pattern && !options.pattern.test(value)) {
      return { valid: false, error: '格式不正确' };
    }
  }
  
  return { valid: true };
}

/**
 * 友好的错误提示
 */
export function getFriendlyErrorMessage(error: any): string {
  if (error instanceof DatabaseError) {
    return '数据操作失败，请重试';
  }
  
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error?.message?.includes('network')) {
    return '网络连接失败，请检查网络设置';
  }
  
  if (error?.message?.includes('timeout')) {
    return '操作超时，请重试';
  }
  
  return '操作失败，请稍后重试';
}
