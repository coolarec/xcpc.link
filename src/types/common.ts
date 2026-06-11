export type Nullable<T> = T | null

export interface OptionItem<T = string> {
  label: string
  value: T
}
