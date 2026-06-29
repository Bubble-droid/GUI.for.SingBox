import type Button from './Button/index.vue'
import type Card from './Card/index.vue'
import type CheckBox from './CheckBox/index.vue'
import type CodeEditor from './CodeEditor/index.vue'
import type CodeViewer from './CodeViewer/index.vue'
import type ColorPicker from './ColorPicker/index.vue'
import type Confirm from './Confirm/index.vue'
import type CustomAction from './CustomAction/index.vue'
import type Divider from './Divider/index.vue'
import type Dropdown from './Dropdown/index.vue'
import type Empty from './Empty/index.vue'
import type Icon from './Icon/index.vue'
import type Input from './Input/index.vue'
import type InputList from './InputList/index.vue'
import type InterfaceSelect from './InterfaceSelect/index.vue'
import type KeyValueEditor from './KeyValueEditor/index.vue'
import type MarkdownViewer from './MarkdownViewer/index.vue'
import type Menu from './Menu/index.vue'
import type Message from './Message/index.vue'
import type Modal from './Modal/index.vue'
import type Pagination from './Pagination/index.vue'
import type Picker from './Picker/index.vue'
import type Progress from './Progress/index.vue'
import type Prompt from './Prompt/index.vue'
import type Radio from './Radio/index.vue'
import type ResourceSelect from './ResourceSelect/index.vue'
import type MultipleSelect from './Select/index.vue'
import type Select from './Select/index.vue'
import type Switch from './Switch/index.vue'
import type Table from './Table/index.vue'
import type Tabs from './Tabs/index.vue'
import type Tag from './Tag/index.vue'
import type Tips from './Tips/index.vue'
import type TrafficChart from './TrafficChart/index.vue'

declare module 'vue' {
  export interface GlobalComponents {
    Button: typeof Button
    Card: typeof Card
    CheckBox: typeof CheckBox
    CodeViewer: typeof CodeViewer
    CodeEditor: typeof CodeEditor
    ColorPicker: typeof ColorPicker
    Confirm: typeof Confirm
    CustomAction: typeof CustomAction
    Divider: typeof Divider
    Dropdown: typeof Dropdown
    Empty: typeof Empty
    Icon: typeof Icon
    Input: typeof Input
    InputList: typeof InputList
    InterfaceSelect: typeof InterfaceSelect
    KeyValueEditor: typeof KeyValueEditor
    Menu: typeof Menu
    Message: typeof Message
    MarkdownViewer: typeof MarkdownViewer
    Modal: typeof Modal
    MultipleSelect: typeof MultipleSelect
    Pagination: typeof Pagination
    Picker: typeof Picker
    Progress: typeof Progress
    Prompt: typeof Prompt
    Radio: typeof Radio
    ResourceSelect: typeof ResourceSelect
    Select: typeof Select
    Switch: typeof Switch
    Table: typeof Table
    Tabs: typeof Tabs
    Tag: typeof Tag
    Tips: typeof Tips
    TrafficChart: typeof TrafficChart
  }
}
