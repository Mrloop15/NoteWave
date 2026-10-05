<?php

namespace App\Http\Controllers\Entries;

use App\Actions\Entries\CompleteEntry;
use App\Actions\Entries\CreateEntry;
use App\Actions\Entries\DeleteEntry;
use App\Actions\Entries\ListEntries;
use App\Actions\Entries\UpdateEntry;
use App\Http\Controllers\Controller;
use App\Http\Requests\Entries\CompleteEntryRequest;
use App\Http\Requests\Entries\ListEntriesRequest;
use App\Http\Requests\Entries\MutateEntryRequest;
use App\Http\Requests\Entries\StoreEntryRequest;
use App\Http\Requests\Entries\UpdateEntryRequest;
use App\Http\Resources\EntryResource;
use App\Models\Entry;
use Illuminate\Support\Facades\Gate;

class EntryController extends Controller
{
    public function index(ListEntriesRequest $request, ListEntries $action)
    {
        return EntryResource::collection($action->execute($request->user(), $request->validated()));
    }

    public function store(StoreEntryRequest $request, CreateEntry $action)
    {
        return (new EntryResource($action->execute($request->user(), $request->validated())))->response()->setStatusCode(201);
    }

    public function show(Entry $entry)
    {
        Gate::authorize('view', $entry);

        return new EntryResource($entry);
    }

    public function update(UpdateEntryRequest $request, Entry $entry, UpdateEntry $action)
    {
        return new EntryResource($action->execute($request->user(), $entry, $request->validated()));
    }

    public function completion(CompleteEntryRequest $request, Entry $entry, CompleteEntry $action)
    {
        return new EntryResource($action->execute($request->user(), $entry, $request->integer('version'), $request->boolean('completed')));
    }

    public function destroy(MutateEntryRequest $request, Entry $entry, DeleteEntry $action)
    {
        $action->execute($request->user(), $entry, $request->integer('version'));

        return response()->noContent();
    }
}
