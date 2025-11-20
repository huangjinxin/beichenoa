/**
 * 预置表单模板定义
 * 包含数据联动功能的表单模板
 */

// 新生入园登记表
export const STUDENT_ENROLLMENT_TEMPLATE = {
  title: '新生入园登记表',
  description: '用于登记新入园学生的基本信息，审批通过后自动创建学生档案',
  isPreset: true,
  presetType: 'student_enrollment',

  fields: [
    // 基本信息
    {
      id: 'studentName',
      type: 'text',
      label: '学生姓名',
      required: true,
      placeholder: '请输入学生姓名',
    },
    {
      id: 'gender',
      type: 'select',
      label: '性别',
      required: true,
      options: ['男', '女'],
    },
    {
      id: 'birthday',
      type: 'date',
      label: '出生日期',
      required: true,
    },
    {
      id: 'idCard',
      type: 'text',
      label: '身份证号',
      required: false,
      placeholder: '请输入18位身份证号',
      config: {
        uniqueCheck: {
          entityType: 'student',
          field: 'idCard',
        },
      },
    },

    // 入园信息
    {
      id: 'enrollDate',
      type: 'date',
      label: '入园日期',
      required: true,
    },
    {
      id: 'classId',
      type: 'class_select',
      label: '分配班级',
      required: true,
      placeholder: '请选择班级',
    },

    // 联系信息
    {
      id: 'address',
      type: 'text',
      label: '家庭住址',
      required: true,
      placeholder: '请输入详细地址',
    },
    {
      id: 'allergies',
      type: 'textarea',
      label: '过敏信息',
      required: false,
      placeholder: '如有过敏情况请填写，无则留空',
    },

    // 家长信息
    {
      id: 'parentName',
      type: 'text',
      label: '主要联系人',
      required: true,
      placeholder: '家长姓名',
    },
    {
      id: 'parentPhone',
      type: 'text',
      label: '联系电话',
      required: true,
      placeholder: '请输入11位手机号',
    },
    {
      id: 'parentRelation',
      type: 'select',
      label: '与学生关系',
      required: true,
      options: ['父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '其他'],
    },
  ],

  // 实体绑定配置
  entityBindingConfig: {
    entityType: 'student',
    actionType: 'create',
    triggerOn: 'approved',
    fieldMappings: [
      { formField: 'studentName', entityField: 'name' },
      { formField: 'gender', entityField: 'gender' },
      { formField: 'birthday', entityField: 'birthday' },
      { formField: 'idCard', entityField: 'idCard' },
      { formField: 'enrollDate', entityField: 'enrollDate' },
      { formField: 'classId', entityField: 'classId' },
      { formField: 'address', entityField: 'address' },
      { formField: 'allergies', entityField: 'allergies' },
      { formField: 'parentPhone', entityField: 'primaryPhone' },
    ],
    uniqueFields: [
      { formField: 'idCard', entityField: 'idCard', errorMessage: '该身份证号的学生已存在' },
    ],
  },

  serialNumberConfig: {
    prefix: 'ENROLL',
    dateFormat: 'YYYY',
    digits: 4,
  },
};

// 教师入职申请表
export const TEACHER_ONBOARDING_TEMPLATE = {
  title: '教师入职申请表',
  description: '用于新教师入职信息登记，审批通过后自动创建教师账号',
  isPreset: true,
  presetType: 'teacher_onboarding',

  fields: [
    // 基本信息
    {
      id: 'name',
      type: 'text',
      label: '姓名',
      required: true,
      placeholder: '请输入姓名',
    },
    {
      id: 'gender',
      type: 'select',
      label: '性别',
      required: true,
      options: ['男', '女'],
    },
    {
      id: 'birthday',
      type: 'date',
      label: '出生日期',
      required: true,
    },
    {
      id: 'idCard',
      type: 'text',
      label: '身份证号',
      required: true,
      placeholder: '请输入18位身份证号',
      config: {
        uniqueCheck: {
          entityType: 'user',
          field: 'idCard',
        },
      },
    },

    // 联系方式
    {
      id: 'phone',
      type: 'text',
      label: '手机号',
      required: true,
      placeholder: '请输入11位手机号',
      config: {
        uniqueCheck: {
          entityType: 'user',
          field: 'phone',
        },
      },
    },
    {
      id: 'email',
      type: 'text',
      label: '邮箱',
      required: true,
      placeholder: '请输入邮箱地址',
      config: {
        uniqueCheck: {
          entityType: 'user',
          field: 'email',
        },
      },
    },

    // 入职信息
    {
      id: 'hireDate',
      type: 'date',
      label: '入职日期',
      required: true,
    },
    {
      id: 'education',
      type: 'select',
      label: '学历',
      required: true,
      options: ['高中', '大专', '本科', '硕士', '博士'],
    },
    {
      id: 'major',
      type: 'text',
      label: '专业',
      required: false,
      placeholder: '请输入所学专业',
    },

    // 银行信息
    {
      id: 'bankAccount',
      type: 'text',
      label: '银行卡号',
      required: false,
      placeholder: '请输入银行卡号',
    },
    {
      id: 'bankName',
      type: 'text',
      label: '开户行',
      required: false,
      placeholder: '如：中国银行xxx支行',
    },
  ],

  // 实体绑定配置
  entityBindingConfig: {
    entityType: 'user',
    actionType: 'create',
    triggerOn: 'approved',
    fieldMappings: [
      { formField: 'name', entityField: 'name' },
      { formField: 'gender', entityField: 'gender' },
      { formField: 'birthday', entityField: 'birthday' },
      { formField: 'idCard', entityField: 'idCard' },
      { formField: 'phone', entityField: 'phone' },
      { formField: 'email', entityField: 'email' },
      { formField: 'hireDate', entityField: 'hireDate' },
      { formField: 'bankAccount', entityField: 'bankAccount' },
      { formField: 'bankName', entityField: 'bankName' },
    ],
    uniqueFields: [
      { formField: 'email', entityField: 'email', errorMessage: '该邮箱已被注册' },
      { formField: 'idCard', entityField: 'idCard', errorMessage: '该身份证号已存在' },
      { formField: 'phone', entityField: 'phone', errorMessage: '该手机号已被使用' },
    ],
    defaultValues: {
      role: 'TEACHER',
      isActive: true,
      employmentStatus: 'PROBATION',
    },
  },

  serialNumberConfig: {
    prefix: 'HIRE',
    dateFormat: 'YYYY',
    digits: 4,
  },
};

// 学生信息变更表
export const STUDENT_INFO_CHANGE_TEMPLATE = {
  title: '学生信息变更申请',
  description: '用于修改学生档案信息，审批通过后自动更新学生记录',
  isPreset: true,
  presetType: 'student_info_change',

  fields: [
    // 选择学生
    {
      id: 'studentId',
      type: 'student_select',
      label: '选择学生',
      required: true,
      placeholder: '请输入学生姓名搜索',
      config: {
        autoFill: [
          { from: 'name', to: 'currentName' },
          { from: 'idCard', to: 'currentIdCard' },
          { from: 'address', to: 'currentAddress' },
          { from: 'allergies', to: 'currentAllergies' },
          { from: 'className', to: 'currentClassName' },
        ],
      },
    },

    // 当前信息（只读）
    {
      id: 'currentName',
      type: 'text',
      label: '当前姓名',
      readonly: true,
    },
    {
      id: 'currentIdCard',
      type: 'text',
      label: '当前身份证号',
      readonly: true,
    },
    {
      id: 'currentAddress',
      type: 'text',
      label: '当前地址',
      readonly: true,
    },
    {
      id: 'currentAllergies',
      type: 'text',
      label: '当前过敏信息',
      readonly: true,
    },
    {
      id: 'currentClassName',
      type: 'text',
      label: '当前班级',
      readonly: true,
    },

    // 变更信息
    {
      id: 'newName',
      type: 'text',
      label: '新姓名',
      required: false,
      placeholder: '如需修改姓名请填写',
    },
    {
      id: 'newIdCard',
      type: 'text',
      label: '新身份证号',
      required: false,
      placeholder: '如需修改身份证号请填写',
    },
    {
      id: 'newAddress',
      type: 'text',
      label: '新地址',
      required: false,
      placeholder: '如需修改地址请填写',
    },
    {
      id: 'newAllergies',
      type: 'textarea',
      label: '新过敏信息',
      required: false,
      placeholder: '如需修改过敏信息请填写',
    },

    // 变更原因
    {
      id: 'reason',
      type: 'textarea',
      label: '变更原因',
      required: true,
      placeholder: '请说明变更原因',
    },
  ],

  // 实体绑定配置
  entityBindingConfig: {
    entityType: 'student',
    actionType: 'update',
    triggerOn: 'approved',
    fieldMappings: [
      { formField: 'studentId', entityField: 'id' },
      { formField: 'newName', entityField: 'name' },
      { formField: 'newIdCard', entityField: 'idCard' },
      { formField: 'newAddress', entityField: 'address' },
      { formField: 'newAllergies', entityField: 'allergies' },
    ],
  },

  serialNumberConfig: {
    prefix: 'CHANGE',
    dateFormat: 'YYYY',
    digits: 4,
  },
};

// 学生转班申请表
export const CLASS_TRANSFER_TEMPLATE = {
  title: '学生转班申请',
  description: '用于学生班级调整，审批通过后自动更新学生班级',
  isPreset: true,
  presetType: 'class_transfer',

  fields: [
    // 选择学生
    {
      id: 'studentId',
      type: 'student_select',
      label: '选择学生',
      required: true,
      placeholder: '请输入学生姓名搜索',
      config: {
        autoFill: [
          { from: 'name', to: 'studentName' },
          { from: 'classId', to: 'fromClassId' },
          { from: 'className', to: 'fromClassName' },
          { from: 'classGrade', to: 'currentGrade' },
        ],
      },
    },

    // 学生信息（只读）
    {
      id: 'studentName',
      type: 'text',
      label: '学生姓名',
      readonly: true,
    },
    {
      id: 'fromClassId',
      type: 'hidden',
      label: '原班级ID',
    },
    {
      id: 'fromClassName',
      type: 'text',
      label: '原班级',
      readonly: true,
    },
    {
      id: 'currentGrade',
      type: 'text',
      label: '当前年级',
      readonly: true,
    },

    // 目标班级
    {
      id: 'toClassId',
      type: 'class_select',
      label: '目标班级',
      required: true,
      placeholder: '请选择目标班级',
      config: {
        showCapacity: true,
      },
    },

    // 转班原因和生效日期
    {
      id: 'reason',
      type: 'textarea',
      label: '转班原因',
      required: true,
      placeholder: '请说明转班原因',
    },
    {
      id: 'effectiveDate',
      type: 'date',
      label: '生效日期',
      required: true,
    },
  ],

  // 实体绑定配置
  entityBindingConfig: {
    entityType: 'student',
    actionType: 'update',
    triggerOn: 'approved',
    fieldMappings: [
      { formField: 'studentId', entityField: 'id' },
      { formField: 'toClassId', entityField: 'classId' },
    ],
  },

  serialNumberConfig: {
    prefix: 'TRANSFER',
    dateFormat: 'YYYY',
    digits: 4,
  },
};

// 所有数据联动相关的预置模板
export const ENTITY_BINDING_TEMPLATES = [
  STUDENT_ENROLLMENT_TEMPLATE,
  TEACHER_ONBOARDING_TEMPLATE,
  STUDENT_INFO_CHANGE_TEMPLATE,
  CLASS_TRANSFER_TEMPLATE,
];
