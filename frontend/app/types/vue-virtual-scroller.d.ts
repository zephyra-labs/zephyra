declare module 'vue-virtual-scroller' {
  import { DefineComponent } from 'vue'

  interface DynamicScrollerProps {
    items: any[]
    minItemHeight?: number
    height?: string | number
    keyField?: string
  }

  interface DynamicScrollerItemProps {
    item: any
    index?: number
  }

  export const DynamicScroller: DefineComponent<DynamicScrollerProps>
  export const DynamicScrollerItem: DefineComponent<DynamicScrollerItemProps>
}
