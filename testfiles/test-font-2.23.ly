\version "2.23.3"

\paper {
  fonts = #(set-global-fonts
    #:music "beethoven"
    #:brace "beethoven"
    #:factor (/ staff-height pt 20)
  )
}

\relative c {
  c d e f g a b c
}
