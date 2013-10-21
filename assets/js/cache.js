/*
 * Implement a cache object. The replacement method used here is Push-To-Front
 */
function Cache(cacheCapacity)
{
	if(typeof(cacheCapacity) === 'undefined')
		cacheCapacity = 10;

	this.capacity = cacheCapacity;
	this.size = 0;
	this.head = null;
	this.tail = null;
}

function Node (id, data)
{
	this.id = id;
	this.data = data;
	this.next = null;
	this.prev = null;
}

//Cache.prototype.constructor = Cache;
Cache.prototype.insert = function(id, data)
{
	// Check if there is still capacity for new element
	if(this.size == this.capacity)
	{
		// Have to remove the last element
		if(this.size == 1)
		{
			this.head = null;
			this.tail = null;
		}
		else
		{
			var beforeTail = this.tail.prev;
			beforeTail.next = null;
			this.tail = beforeTail;
		}
		this.size--;

	}

	// Add new element at the front
	var newNode = new Node(id, data);

	if(this.size == 0)
	{
		this.head = newNode;
		this.tail = newNode;
	}
	else
	{
		var oldHeadNode = this.head;
		this.head = newNode;
		newNode.next = oldHeadNode;
		oldHeadNode.prev = newNode;
	}
	this.size++;
}

Cache.prototype.remove = function(curNode)
{
	if(curNode === null)
		return;

	if(this.size == 1)
	{
		this.size = 0;
		this.head = null;
		this.tail = null;
		return;
	}

	var prevNode = curNode.prev;
	var nextNode = curNode.next;

	if(prevNode === null)
		// The removed node is the head
		this.head = nextNode;
	
	if(nextNode === null)
		// The removed node is the tail
		this.tail = prevNode;
	
	if(prevNode !== null)
		prevNode.next = nextNode;
	
	if(nextNode !== null)
		nextNode.prev = prevNode;
	
	this.size--;
}

Cache.prototype.getItem = function(id)
{
	if(typeof(id) === 'undefined')
		return null;
	if(this.size == 0)
		return null;

	var curNode = this.head;
	while(curNode !== null)
	{
		if(curNode.id == id)
		{
			var retData = curNode.data;

			// Push to front here
			this.remove(curNode);
			this.insert(id, retData);

			return retData;
		}
		curNode = curNode.next;
	}

	return null;
}
