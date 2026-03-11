import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 如果是占位符，返回 null 而不是报错
const isPlaceholder = !supabaseUrl || supabaseUrl.startsWith('your_')

export const supabase = isPlaceholder ? null : createClient(supabaseUrl, supabaseAnonKey)
