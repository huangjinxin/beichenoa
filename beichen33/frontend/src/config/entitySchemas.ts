// 实体字段元数据配置
// 定义各实体类型可以收集的字段及其属性

export interface EntityFieldDef {
  field: string;       // 字段名
  label: string;       // 显示标签
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'reference';
  required: boolean;   // 是否必填
  unique?: boolean;    // 是否唯一
  options?: string[];  // select类型的选项
  refType?: string;    // reference类型引用的实体
  placeholder?: string;
}

export interface EntitySchema {
  label: string;
  icon: string;
  fields: EntityFieldDef[];
  // 创建实体时的默认值
  defaults?: Record<string, any>;
}

export const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
  student: {
    label: '学生',
    icon: '👦',
    fields: [
      { field: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入学生姓名' },
      { field: 'gender', label: '性别', type: 'select', required: true, options: ['男', '女'] },
      { field: 'birthday', label: '出生日期', type: 'date', required: true },
      { field: 'idCard', label: '身份证号', type: 'text', required: false, unique: true, placeholder: '18位身份证号' },
      { field: 'enrollDate', label: '入园日期', type: 'date', required: true },
      { field: 'classId', label: '分配班级', type: 'reference', required: true, refType: 'class' },
      { field: 'address', label: '家庭住址', type: 'text', required: false, placeholder: '详细地址' },
      { field: 'allergies', label: '过敏信息', type: 'textarea', required: false, placeholder: '如有过敏情况请填写' },
      { field: 'parentName', label: '家长姓名', type: 'text', required: true, placeholder: '主要联系人姓名' },
      { field: 'parentPhone', label: '家长电话', type: 'text', required: true, placeholder: '11位手机号' },
      { field: 'parentRelation', label: '与学生关系', type: 'select', required: true, options: ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '其他'] },
    ],
  },
  teacher: {
    label: '教师',
    icon: '👩‍🏫',
    fields: [
      { field: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入教师姓名' },
      { field: 'gender', label: '性别', type: 'select', required: true, options: ['男', '女'] },
      { field: 'phone', label: '手机号', type: 'text', required: true, unique: true, placeholder: '11位手机号' },
      { field: 'email', label: '邮箱', type: 'text', required: true, unique: true, placeholder: '用于登录系统' },
      { field: 'idCard', label: '身份证号', type: 'text', required: false, unique: true, placeholder: '18位身份证号' },
      { field: 'birthday', label: '出生日期', type: 'date', required: false },
      { field: 'hireDate', label: '入职日期', type: 'date', required: true },
      { field: 'positionId', label: '职位', type: 'reference', required: false, refType: 'position' },
      { field: 'education', label: '学历', type: 'select', required: false, options: ['高中', '大专', '本科', '硕士', '博士'] },
      { field: 'major', label: '专业', type: 'text', required: false, placeholder: '所学专业' },
      { field: 'campusId', label: '所属园区', type: 'reference', required: true, refType: 'campus' },
    ],
    defaults: {
      role: 'TEACHER',
    },
  },
  class: {
    label: '班级',
    icon: '🏫',
    fields: [
      { field: 'name', label: '班级名称', type: 'text', required: true, placeholder: '如：小一班' },
      { field: 'grade', label: '年级', type: 'select', required: true, options: ['小班', '中班', '大班', '学前班'] },
      { field: 'capacity', label: '容量', type: 'number', required: true, placeholder: '最大学生数' },
      { field: 'campusId', label: '所属园区', type: 'reference', required: true, refType: 'campus' },
    ],
  },
  campus: {
    label: '园区',
    icon: '🏠',
    fields: [
      { field: 'name', label: '园区名称', type: 'text', required: true, placeholder: '请输入园区名称' },
      { field: 'address', label: '地址', type: 'text', required: true, placeholder: '详细地址' },
      { field: 'phone', label: '联系电话', type: 'text', required: false, placeholder: '座机或手机' },
    ],
  },
};

// 引用字段可自动填充的属性
export const REFERENCE_AUTO_FILL_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
  student: [
    { label: '学生姓名', value: 'name' },
    { label: '性别', value: 'gender' },
    { label: '身份证号', value: 'idCard' },
    { label: '出生日期', value: 'birthday' },
    { label: '年龄段', value: 'ageGroup' },
    { label: '班级ID', value: 'classId' },
    { label: '班级名称', value: 'className' },
    { label: '园区ID', value: 'campusId' },
    { label: '园区名称', value: 'campusName' },
    { label: '家庭住址', value: 'address' },
    { label: '过敏信息', value: 'allergies' },
  ],
  teacher: [
    { label: '教师姓名', value: 'name' },
    { label: '手机号', value: 'phone' },
    { label: '邮箱', value: 'email' },
    { label: '性别', value: 'gender' },
    { label: '职位ID', value: 'positionId' },
    { label: '职位名称', value: 'positionName' },
    { label: '园区ID', value: 'campusId' },
    { label: '园区名称', value: 'campusName' },
  ],
  class: [
    { label: '班级名称', value: 'name' },
    { label: '年级', value: 'grade' },
    { label: '容量', value: 'capacity' },
    { label: '当前人数', value: 'studentCount' },
    { label: '剩余名额', value: 'availableSlots' },
    { label: '园区ID', value: 'campusId' },
    { label: '园区名称', value: 'campusName' },
  ],
  campus: [
    { label: '园区名称', value: 'name' },
    { label: '地址', value: 'address' },
    { label: '电话', value: 'phone' },
  ],
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
