const logic = function (Logic) {
  const {questionList, currentPage, $util: util} = this
  this.isSuspend = '0'
  for (const item of questionList.filter(item => item.page === currentPage && !item.ignore)) {
    const {allOrderById, crtDescIndex, descList} = item
    /* const relItem = questionList.find(rel => rel.quoteQuId === id)
        if (relItem) {
          let title = util.getQuoteTitle(questionList, relItem, 'answer')
          relItem.syncQuoteTitle && relItem.syncQuoteTitle(questionList, 'answer')
          relItem.title = title
        } */
    for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById)) {
      afterQu.title = afterQu.orgTitle.replace(/\[(.*)\]/g, '')
      const { optionList, descList } = afterQu
      if (optionList) {
        optionList.forEach(item => {
          item.optionName = item.orgTitle.replace(/\[(.*)\]/g, '')
        })
      }
      if (descList) {
        descList.forEach(item => {
          item.optionName = item.orgTitle.replace(/\[(.*)\]/g, '')
        })
      }
    }
    util.syncQuoteTitle(questionList, item, 'answer')
    for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById)) {
      afterQu.visibility = true
    }

    const quLogics = item.quLogics

    if (quLogics && quLogics.length) {
      for (const logic of quLogics) {
        const { toQuId, subQuId } = logic
        if (!toQuId) {
          continue
        }
        if (subQuId && crtDescIndex !== undefined) {
          const subItem = descList[crtDescIndex]
          if (subItem.id !== subQuId) {
            continue
          }
        }
        const toQuItem = this.getQuItem(toQuId)
        this.clearLogicValue(logic, toQuItem)
      }
      for (const logic of quLogics) {
        const {quType, subQuId, logicType, toQuId} = logic
        let value = item.value
        if (/^CHENRADIO|CHENCHECKBOX$/.test(quType) && subQuId) {
          value = item.descList.find(item => item.id === subQuId).value
        }
        if (util.isNull(value) && logicType === '2') {
          for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById)) {
            afterQu.visibility = false
          }
          this.isSuspend = '1'
          return
        }
        const toQuItem = this.getQuItem(toQuId)
        // 跳转逻辑 如果 题目序号在上个题目的跳转逻辑之间则隐藏
        if (
          util.isNull(value) &&
          logicType === '1'
        ) {
          for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById &&
            afterQu.allOrderById < toQuItem.allOrderById)) {
            afterQu.visibility = false
          }
        }
        value = util.str2arr(value)
        let {anQuItemId, anValue} = logic
        anQuItemId = util.str2arr(anQuItemId)
        anValue = util.str2arr(anValue)
        const validQuLogics = Logic[item.elementType].validQuLogics
        const validResult = validQuLogics.bind(this)(
          item,
          logic,
          item,
          toQuItem,
          value,
          anQuItemId,
          anValue
        )
        // console.log('afterQu', logicType, validResult)
        if (!validResult) {
          if (logicType === '1') {
            for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById &&
              afterQu.allOrderById < toQuItem.allOrderById)) {
              afterQu.visibility = false
            }
          } else if (logicType === '2') {
            for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById)) {
              afterQu.visibility = false
            }
            this.isSuspend = '1'
            return
          }
        }
      }
    }

    // 组前逻辑
    for (const group of this.groupList.filter(item => item.allOrderById > allOrderById && !util.isNull(item.quGroupLogics))) {
      const quGroupLogics = group.quGroupLogics
      if (quGroupLogics && quGroupLogics.length) {
        let resultStr = ''
        for (const groupLogic of quGroupLogics) {
          const {anAnd, anQuId} = groupLogic
          /* if (anQuId !== id) {
                continue
              } */
          const beforeQuItem = this.getQuItem(anQuId)
          let value = beforeQuItem.value
          if (anAnd === '1') {
            resultStr += ` || `
          } else if (anAnd === '2') {
            resultStr += ` && `
          }
          value = util.str2arr(value)
          let {anQuItemId, anValue} = groupLogic
          anQuItemId = util.str2arr(anQuItemId)
          anValue = util.str2arr(anValue)
          const getQuBeforLogicsExpress =
            Logic[beforeQuItem.elementType].getQuBeforLogicsExpress
          resultStr += getQuBeforLogicsExpress.bind(this)(
            groupLogic,
            beforeQuItem,
            value,
            anQuItemId,
            anValue
          )
        }
        if (resultStr) {
          // eslint-disable-next-line
          const isShow = eval(resultStr)
          if (!isShow) {
            for (const qu of group.questionList) {
              qu.visibility = false
            }
          }
        }
      }
    }
    // 题前逻辑
    for (const afterQu of questionList.filter(afterQu => afterQu.allOrderById > allOrderById &&
      !util.isNull(afterQu.quBeforLogics))) {
      const quBeforLogics = afterQu.quBeforLogics
      if (quBeforLogics && quBeforLogics.length) {
        let resultStr = ''
        for (const beforlogic of quBeforLogics) {
          const {anAnd} = beforlogic
          /* if (anQuId !== id) {
                continue
              } */
          const {anQuId} = beforlogic
          const beforeQuItem = this.getQuItem(anQuId)
          let value = beforeQuItem.value
          if (anAnd === '1') {
            resultStr += ` || `
          } else if (anAnd === '2') {
            resultStr += ` && `
          }
          value = util.str2arr(value)
          let {anQuItemId, anValue} = beforlogic
          anQuItemId = util.str2arr(anQuItemId)
          anValue = util.str2arr(anValue)
          const getQuBeforLogicsExpress =
            Logic[beforeQuItem.elementType].getQuBeforLogicsExpress
          resultStr += getQuBeforLogicsExpress.bind(this)(
            beforlogic,
            beforeQuItem,
            value,
            anQuItemId,
            anValue
          )
        }
        if (resultStr) {
          // eslint-disable-next-line
          const isShow = eval(resultStr)
          if (!isShow) {
            afterQu.visibility = false
          }
        }
      }
    }
  }
}
export default logic
