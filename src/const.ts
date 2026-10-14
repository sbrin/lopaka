export const SCALE_LIST = [25, 50, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000];

export const DISPLAY_OBJECT_KEYWORDS = new Set(`
    alignas alignof and and_eq asm auto bitand bitor bool break case catch char char8_t char16_t char32_t
    class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield
    decltype default delete do double dynamic_cast else enum explicit export extern false float for friend
    goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private
    protected public register reinterpret_cast requires return short signed sizeof static static_assert
    static_cast struct switch template this thread_local throw true try typedef typeid typename union
    unsigned using virtual void volatile wchar_t while xor xor_eq restrict _Alignas _Alignof _Atomic _Bool
    _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local False None True as assert async await
    def del elif except finally from global import in is lambda nonlocal pass raise with yield
`.trim().split(/\s+/));

// GNU C/C++ extensions and alternate spellings used by embedded toolchains.
export const DISPLAY_OBJECT_GNU_KEYWORDS = new Set(`
    typeof typeof_unqual __typeof __typeof__ __typeof_unqual __typeof_unqual__
    __asm __asm__ __inline __inline__ __alignof __alignof__
    __attribute __attribute__ __auto_type __extension__ __thread __label__
    __const __const__ __volatile __volatile__ __signed __signed__
    __restrict __restrict__ __complex __complex__ __real __real__ __imag __imag__
`.trim().split(/\s+/));
