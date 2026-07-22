export type PhotoSize = {
  id: string
  name: string
  width: number
  height: number
  widthMm: number
  heightMm: number
  category: string
  hot?: boolean
}

export const categories = ['普通寸照', '近期热门', '学历考试', '公务员', '职业资格', '财务会计', '医药卫生', '建筑工程', '图像采集', '其他']

export const photoSizes: PhotoSize[] = [
  { id: 'one-inch', name: '一寸照', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '普通寸照', hot: true },
  { id: 'two-inch', name: '二寸照', width: 413, height: 579, widthMm: 35, heightMm: 49, category: '普通寸照', hot: true },
  { id: 'large-one', name: '大一寸照', width: 390, height: 567, widthMm: 33, heightMm: 48, category: '普通寸照' },
  { id: 'small-one', name: '小一寸照', width: 260, height: 378, widthMm: 22, heightMm: 32, category: '普通寸照' },
  { id: 'large-two', name: '大二寸照', width: 413, height: 626, widthMm: 35, heightMm: 53, category: '普通寸照' },
  { id: 'small-two', name: '小二寸照', width: 413, height: 531, widthMm: 35, heightMm: 45, category: '普通寸照', hot: true },
  { id: 'three', name: '三寸照', width: 650, height: 992, widthMm: 55, heightMm: 84, category: '普通寸照' },
  { id: 'four', name: '四寸照', width: 898, height: 1181, widthMm: 76, heightMm: 100, category: '普通寸照' },
  { id: 'five', name: '五寸照', width: 1051, height: 1500, widthMm: 89, heightMm: 127, category: '普通寸照' },
  { id: 'work-one', name: '一寸工作证', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '职业资格' },
  { id: 'work-two', name: '二寸工作证', width: 413, height: 579, widthMm: 35, heightMm: 49, category: '职业资格' },
  { id: 'marriage', name: '结婚登记照', width: 626, height: 413, widthMm: 53, heightMm: 35, category: '近期热门', hot: true },
  { id: 'divorce', name: '离婚登记照', width: 413, height: 626, widthMm: 35, heightMm: 53, category: '其他' },
  { id: 'social-security', name: '社保卡证件照（无回执）', width: 358, height: 441, widthMm: 26, heightMm: 32, category: '近期热门', hot: true },
  { id: 'driver-12123', name: '驾驶证图像采集（交管12123）', width: 780, height: 1134, widthMm: 22, heightMm: 32, category: '图像采集', hot: true },
  { id: 'teacher', name: '教师资格证', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '职业资格' },
  { id: 'accountant', name: '初级会计考试', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '财务会计' },
  { id: 'civil-service', name: '公务员考试', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '公务员' },
  { id: 'college-exam', name: '大学英语四六级', width: 144, height: 192, widthMm: 25, heightMm: 35, category: '学历考试' },
  { id: 'nurse', name: '护士资格证', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '医药卫生' },
  { id: 'constructor', name: '一级建造师', width: 295, height: 413, widthMm: 25, heightMm: 35, category: '建筑工程' },
  { id: 'passport', name: '中国护照', width: 390, height: 567, widthMm: 33, heightMm: 48, category: '近期热门', hot: true },
  { id: 'visa-us', name: '美国签证', width: 600, height: 600, widthMm: 51, heightMm: 51, category: '其他' },
]
