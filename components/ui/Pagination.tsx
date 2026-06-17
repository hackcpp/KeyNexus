type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  countLabel?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  countLabel = '条',
}: PaginationProps) {
  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-ghost"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ◀ 上一页
      </button>
      <span className="pagination-info">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        下一页 ▶
      </button>
    </div>
  )
}
