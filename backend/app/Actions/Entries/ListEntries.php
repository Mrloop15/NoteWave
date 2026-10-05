<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListEntries
{
    public function execute(User $user, array $filters): LengthAwarePaginator
    {
        $query = Entry::where('user_id', $user->id);
        if (isset($filters['kind'])) {
            $query->where('kind', $filters['kind']);
        }
        if (isset($filters['status'])) {
            $query->where('kind', 'task');
            $filters['status'] === 'completed' ? $query->whereNotNull('completed_at') : $query->whereNull('completed_at');
        }
        if (isset($filters['q']) && $filters['q'] !== '') {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $filters['q']).'%';
            $query->where(fn ($search) => $search->whereRaw("title LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("description LIKE ? ESCAPE '!'", [$pattern]));
        }

        return $query->orderByDesc('updated_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 20, ['*'], 'page', $filters['page'] ?? 1);
    }
}
