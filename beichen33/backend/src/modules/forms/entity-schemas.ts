// 实体字段元数据配置
// 定义各实体类型可以收集的字段及其属性

export interface EntityFieldDef {
  field: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'reference';
  required: boolean;
  unique?: boolean;
  options?: string[];
  refType?: string;
}

export interface EntitySchema {
  label: string;
  fields: EntityFieldDef[];
  defaults?: Record<string, any>;
}

export const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
  student: {
    label: '学生',
    fields: [
      { field: 'name', label: '姓名', type: 'text', required: true },
      { field: 'gender', label: '性别', type: 'select', required: true, options: ['男', '女'] },
      { field: 'birthday', label: '出生日期', type: 'date', required: true },
      { field: 'idCard', label: '身份证号', type: 'text', required: false, unique: true },
      { field: 'enrollDate', label: '入园日期', type: 'date', required: true },
      { field: 'classId', label: '分配班级', type: 'reference', required: true, refType: 'class' },
      { field: 'address', label: '家庭住址', type: 'text', required: false },
      { field: 'allergies', label: '过敏信息', type: 'textarea', required: false },
      { field: 'parentName', label: '家长姓名', type: 'text', required: true },
      { field: 'parentPhone', label: '家长电话', type: 'text', required: true },
      { field: 'parentRelation', label: '与学生关系', type: 'select', required: true },
    ],
  },
  teacher: {
    label: '教师',
    fields: [
      { field: 'name', label: '姓名', type: 'text', required: true },
      { field: 'gender', label: '性别', type: 'select', required: true, options: ['男', '女'] },
      { field: 'phone', label: '手机号', type: 'text', required: true, unique: true },
      { field: 'email', label: '邮箱', type: 'text', required: true, unique: true },
      { field: 'idCard', label: '身份证号', type: 'text', required: false, unique: true },
      { field: 'birthday', label: '出生日期', type: 'date', required: false },
      { field: 'hireDate', label: '入职日期', type: 'date', required: true },
      { field: 'positionId', label: '职位', type: 'reference', required: false, refType: 'position' },
      { field: 'education', label: '学历', type: 'select', required: false },
      { field: 'major', label: '专业', type: 'text', required: false },
      { field: 'campusId', label: '所属园区', type: 'reference', required: true, refType: 'campus' },
    ],
    defaults: {
      role: 'TEACHER',
    },
  },
  class: {
    label: '班级',
    fields: [
      { field: 'name', label: '班级名称', type: 'text', required: true },
      { field: 'grade', label: '年级', type: 'select', required: true },
      { field: 'capacity', label: '容量', type: 'number', required: true },
      { field: 'campusId', label: '所属园区', type: 'reference', required: true, refType: 'campus' },
    ],
  },
  campus: {
    label: '园区',
    fields: [
      { field: 'name', label: '园区名称', type: 'text', required: true },
      { field: 'address', label: '地址', type: 'text', required: true },
      { field: 'phone', label: '联系电话', type: 'text', required: false },
    ],
  },
};

// 获取实体必填字段
export function getRequiredFields(entityType: string): string[] {
  const schema = ENTITY_SCHEMAS[entityType];
  if (!schema) return [];
  return schema.fields.filter(f => f.required).map(f => f.field);
}

// 获取实体唯一字段
export function getUniqueFields(entityType: string): string[] {
  const schema = ENTITY_SCHEMAS[entityType];
  if (!schema) return [];
  return schema.fields.filter(f => f.unique).map(f => f.field);
}

// 获取实体默认值
export function getEntityDefaults(entityType: string): Record<string, any> {
  const schema = ENTITY_SCHEMAS[entityType];
  return schema?.defaults || {};
}
