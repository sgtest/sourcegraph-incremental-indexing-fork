--[[
    Returns raw, flattened job data for each job matching the
    provided query term with the provided status.

    Input:
        KEYS[1] key prefix
        KEYS[2] name of the queue
        ARGV[1] search query
        ARGV[2] (inclusive) start index
        ARGV[3] (inclusive) end index
]]

--[[
    Searchable argument keys. This list must be updated if a new
    job type is added to the worker.
]]
local searchableArguments = {
    'repository',
    'commit',
    'root',
}

--[[
    A map from queue names to the command used to retrieve the
    set of ids within an index range.
]]
local commandsByQueue = {
    ['active'] = 'LRANGE',
    ['waiting'] = 'LRANGE',
    ['delayed'] = 'ZRANGE',
    ['completed'] = 'ZREVRANGE',
    ['failed'] = 'ZREVRANGE',
}

--[[
    Extract a the text from a job payload that can be searched.
    This includes the job name, the failed reason and stacktrace,
    and a whitelist of argument (defined above). The table returned
    may contain nil values.
]]
local function extractValues(id, key)
    local values = {
        id,
        redis.call('HGET', key, 'name'),
        redis.call('HGET', key, 'failedReason'),
        redis.call('HGET', key, 'stacktrace'),
    }

    local data = cjson.decode(redis.call('HGET', key, 'data'))
    for _, value in pairs(searchableArguments) do
        table.insert(values, data['args'][value])
    end

    return values
end

--[[
    Determine if the job with the given identifier matches the search
    query. A job matches if every word in the search query is contained
    in _some_ field of the job.
]]
local function jobMatches(id, key)
    local values = extractValues(id, key)

    -- Split search term by whitespace
    for term in string.gmatch(ARGV[1], '%S+') do
        local found = false
        for _, value in pairs(values) do
            -- See if value contains term (do a literal search from first index)
            if type(value) == 'string' and string.find(value, term, 1, true) then
                found = true
                break
            end
        end

        if not found then
            return false
        end
    end

    -- All terms found
    return true
end

-- Get ids of all jobs int he queue in the range [start, end]. The queue is either
-- backed by a list or a set and can be in ascending or descending order. We determine
-- the redis command via the queue name.
local ids = redis.call(commandsByQueue[KEYS[2]], KEYS[1] .. KEYS[2], ARGV[2], ARGV[3])

local matching = {}
for _, v in pairs(ids) do
    if jobMatches(v, KEYS[1] .. v) then
        -- Get job data and add the job id to the payload
        local data = redis.call('HGETALL', KEYS[1] .. v)
        table.insert(data, 'id')
        table.insert(data, v)

        -- Collect all matching jobs
        table.insert(matching, data)
    end
end

return matching
